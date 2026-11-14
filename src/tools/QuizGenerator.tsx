import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Play, Download, Save, Check, RotateCcw, X } from 'lucide-react'
import { useDict, useI18n, l } from '../lib/i18n'
import { aiRequest } from '../lib/ai'
import { saveOutput, logActivity } from '../lib/store'
import { Button, Card, Field, inputCls, download, useAiStatus, cn } from '../components/ui'
import { useAgent, useAgentBridge } from '../components/Agent'
import { SavedList, useOpenSaved, DemoNote, useFlash } from './shared'
import { sampleQuiz, localQuiz } from './demo'
import type { ToolProps } from './registry'

type Q = { q: string; options: string[]; answer: number; explanation: string }
type Doc = { topic: string; text: string; difficulty: string; count: number; questions: Q[]; demo: boolean }

const D = {
  ar: { source: 'المادة التعليمية', topic: 'الموضوع', text: 'النص التعليمي', difficulty: 'الصعوبة', count: 'عدد الأسئلة', gen: 'أنشئ الاختبار', working: 'يُعدّ ساندو الأسئلة…', levels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }, demoIn: 'وضع العرض: يستخدم مولّد الاختبارات مادة وأسئلة نموذجية ثابتة عن «التصيّد الإلكتروني». لتوليد أسئلة من نصّك أنت، فعّل الذكاء الاصطناعي على الخادم.', review: 'الأسئلة والإجابات', quiz: 'وضع الاختبار', start: 'ابدأ الاختبار', submit: 'سلّم الإجابات', retry: 'أعد المحاولة', exit: 'خروج', score: 'نتيجتك', of: 'من', correct: 'الإجابة الصحيحة', why: 'الشرح', export: 'تصدير', save: 'حفظ', saved: 'تم الحفظ', explain: 'اشرح نتيجتي مع ساندو', empty: 'أنشئ الاختبار لتظهر الأسئلة مع الإجابات والشرح، ثم جرّبه في الوضع التفاعلي.', short: 'أضف نصاً تعليمياً أطول من بضع جمل كاملة.', failed: 'تعذّر الوصول إلى الذكاء الاصطناعي، فعرضنا الاختبار النموذجي.', answerAll: 'أجب عن كل الأسئلة أولاً.' },
  en: { source: 'Learning material', topic: 'Topic', text: 'Educational text', difficulty: 'Difficulty', count: 'Number of questions', gen: 'Generate quiz', working: 'SANDO is preparing questions…', levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' }, demoIn: 'Demo Mode: the quiz generator uses fixed sample material and questions about “Phishing awareness”. To generate questions from your own text, enable AI on the server.', review: 'Questions and answers', quiz: 'Quiz mode', start: 'Start quiz', submit: 'Submit answers', retry: 'Try again', exit: 'Exit', score: 'Your score', of: 'of', correct: 'Correct answer', why: 'Explanation', export: 'Export', save: 'Save', saved: 'Saved', explain: 'Explain my score with SANDO', empty: 'Generate the quiz to see questions with answers and explanations, then try it in interactive mode.', short: 'Add a longer educational text with a few full sentences.', failed: 'The AI could not be reached, so the sample quiz is shown.', answerAll: 'Answer every question first.' },
}
const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizGenerator({ autoSample }: ToolProps) {
  const d = useDict(D), { lang } = useI18n(), ai = useAiStatus(), agent = useAgent()
  const [doc, setDoc] = useState<Doc>(() => ({ topic: sampleQuiz(lang).topic, text: sampleQuiz(lang).text, difficulty: 'medium', count: 5, questions: [], demo: false }))
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [mode, setMode] = useState<'review' | 'quiz'>('review')
  const [picks, setPicks] = useState<Record<number, number>>({}), [done, setDone] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null), [saved, flashSave] = useFlash()
  const demoInput = false
  const sample = useMemo(() => sampleQuiz(lang), [lang])
  const shown = demoInput ? { ...doc, topic: sample.topic, text: sample.text } : doc
  const qs = doc.questions
  const score = qs.filter((q, i) => picks[i] === q.answer).length

  const fromSample = (count = doc.count) => setDoc(c => ({ ...c, topic: sample.topic, text: sample.text, count, questions: sample.questions.slice(0, count), demo: true }))
  useEffect(() => { if (autoSample) fromSample(5) }, [autoSample]) // eslint-disable-line
  useOpenSaved<Doc>('quiz-generator', (data, id) => { setDoc(data); setSavedId(id); setMode('review') })
  const reset = () => { setPicks({}); setDone(false) }

  const local = () => {
    const qs = [...(doc.text.trim() === sample.text.trim() ? sample.questions : []), ...localQuiz(doc.text, 10, lang)].slice(0, doc.count)
    if (!qs.length) return setErr(d.short)
    setDoc(c => ({ ...c, questions: qs, demo: false }))
  }
  async function generate() {
    setErr(''); reset(); setMode('review')
    if (ai.live) {
      if (doc.text.trim().length < 40) return setErr(d.short)
      setBusy(true)
      try { const r = await aiRequest<{ questions: Q[] }>('quiz', lang, doc); setDoc(c => ({ ...c, questions: r.questions, demo: false })) }
      catch { local() }
      setBusy(false)
    } else local()
    logActivity('quiz-generator', l(`إنشاء اختبار: ${shown.topic || 'بدون عنوان'}`, `Generated quiz: ${shown.topic || 'untitled'}`))
  }

  const state = useMemo(() => ({ topic: doc.topic, total: qs.length, score: done ? score : null, wrong: done ? qs.filter((q, i) => picks[i] !== q.answer).map(q => q.explanation) : [] }), [doc.topic, qs, done, score, picks])
  useAgentBridge('quiz-generator', state)
  const asText = () => `${doc.topic}\n\n` + qs.map((q, i) => `${i + 1}. ${q.q}\n${q.options.map((o, j) => `   ${LETTERS[j]}) ${o}`).join('\n')}\n   ${d.correct}: ${LETTERS[q.answer]}\n   ${d.why}: ${q.explanation}`).join('\n\n')
  const maxCount = demoInput ? 5 : 10

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card className="space-y-3 p-4 sm:p-5">
          <h2 className="font-display text-sm font-semibold">{d.source}</h2>
          {demoInput && <DemoNote>{d.demoIn}</DemoNote>}
          <Field label={d.topic}><input className={inputCls} readOnly={demoInput} value={shown.topic} onChange={e => setDoc(c => ({ ...c, topic: e.target.value }))} /></Field>
          <Field label={d.text}><textarea rows={7} className={inputCls + ' text-[13px] leading-relaxed'} readOnly={demoInput} value={shown.text} onChange={e => setDoc(c => ({ ...c, text: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.difficulty}><select className={inputCls} disabled={demoInput} value={doc.difficulty} onChange={e => setDoc(c => ({ ...c, difficulty: e.target.value }))}>{Object.entries(d.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={d.count}><input type="number" dir="ltr" min={1} max={maxCount} className={inputCls} value={Math.min(doc.count, maxCount)} onChange={e => setDoc(c => ({ ...c, count: Math.min(maxCount, Math.max(1, Number(e.target.value) || 1)) }))} /></Field>
          </div>
          {err && <p className="text-xs text-amber-400">{err}</p>}
          <Button className="w-full" onClick={generate} disabled={busy}><Sparkles size={16} />{busy ? d.working : d.gen}</Button>
        </Card>
        <Card className="p-4 sm:p-5"><SavedList<Doc> toolId="quiz-generator" activeId={savedId} onOpen={(data, id) => { setDoc(data); setSavedId(id); setMode('review'); reset() }} /></Card>
      </div>

      <Card className="p-4 sm:p-5">
        {!qs.length ? <p className="flex min-h-56 items-center justify-center px-6 text-center text-sm leading-relaxed text-muted">{d.empty}</p> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold">{mode === 'quiz' ? d.quiz : d.review}</h2>
              <div className="flex flex-wrap gap-2">
                {mode === 'review' ? (<>
                  <Button size="sm" variant="outline" onClick={() => download('sando-quiz.txt', asText())}><Download size={14} />{d.export}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSavedId(saveOutput('quiz-generator', doc.topic || 'Quiz', doc, savedId ?? undefined)); flashSave() }}>{saved ? <Check size={14} className="ok-text" /> : <Save size={14} />}{saved ? d.saved : d.save}</Button>
                  <Button size="sm" onClick={() => { reset(); setMode('quiz') }}><Play size={14} className="rtl:-scale-x-100" />{d.start}</Button>
                </>) : <Button size="sm" variant="ghost" onClick={() => setMode('review')}><X size={14} />{d.exit}</Button>}
              </div>
            </div>
            {doc.demo && <DemoNote />}
            {mode === 'quiz' && done && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-400/15 p-4">
                <div><div className="text-xs text-muted">{d.score}</div><div className="font-display text-3xl font-bold" data-testid="quiz-score"><span dir="ltr">{score}</span> <span className="text-base font-normal text-muted">{d.of} {qs.length}</span></div></div>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="soft" onClick={() => agent.ask('explain', d.explain)}><Sparkles size={14} className="brand-text" />{d.explain}</Button><Button size="sm" variant="outline" onClick={reset}><RotateCcw size={14} />{d.retry}</Button></div>
              </div>
            )}
            <ol className="space-y-4">
              {qs.map((q, i) => {
                const reveal = mode === 'review' || done
                return (
                  <li key={i} className="rounded-xl border border-line p-4">
                    <div className="mb-3 text-sm font-medium leading-relaxed"><span className="me-2 text-muted" dir="ltr">{i + 1}.</span>{q.q}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((o, j) => {
                        const right = reveal && j === q.answer, wrong = mode === 'quiz' && done && picks[i] === j && j !== q.answer, picked = mode === 'quiz' && !done && picks[i] === j
                        return (
                          <button key={j} disabled={mode === 'review' || done} onClick={() => setPicks(p => ({ ...p, [i]: j }))}
                            className={cn('flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-start text-[13px] leading-relaxed transition disabled:cursor-default', right ? 'border-cyan-400/60 bg-cyan-400/10' : wrong ? 'border-red-400/60 bg-red-400/10' : picked ? 'border-violet-400 bg-violet-500/15' : 'border-line hover:border-fg/30')}>
                            <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold', right ? 'bg-cyan-400 text-[#070815]' : 'bg-fg/10')}>{right ? <Check size={12} /> : LETTERS[j]}</span>{o}
                          </button>
                        )
                      })}
                    </div>
                    {reveal && <p className="mt-3 border-s-2 border-violet-400/50 ps-3 text-xs leading-relaxed text-muted"><span className="font-medium text-fg/80">{d.why}: </span>{q.explanation}</p>}
                  </li>
                )
              })}
            </ol>
            {mode === 'quiz' && !done && (
              <div className="flex items-center justify-end gap-3">
                {Object.keys(picks).length < qs.length && <span className="text-xs text-muted">{d.answerAll}</span>}
                <Button data-testid="quiz-submit" disabled={Object.keys(picks).length < qs.length} onClick={() => { setDone(true); logActivity('quiz-generator', l(`إكمال اختبار بنتيجة ${score}/${qs.length}`, `Completed a quiz: ${score}/${qs.length}`)) }}>{d.submit}</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
