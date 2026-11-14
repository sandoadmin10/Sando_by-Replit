import { useId } from 'react'
import { cn } from './ui'

/** The SANDO mark: two ribbons folding into an S, with the spark of intelligence at the fold. */
export function Logo({ size = 36, mono, className }: { size?: number; mono?: boolean; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id={id + 'a'} x1="76" y1="20" x2="26" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#d08bff" /><stop offset="1" stopColor="#7257ff" /></linearGradient>
        <linearGradient id={id + 'b'} x1="74" y1="60" x2="24" y2="80" gradientUnits="userSpaceOnUse"><stop stopColor="#3f7bff" /><stop offset="1" stopColor="#1fe6f5" /></linearGradient>
        <linearGradient id={id + 'c'} x1="30" y1="37" x2="70" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#3a2fb8" /><stop offset="1" stopColor="#2a4fd6" /></linearGradient>
      </defs>
      <g fill="none" strokeWidth="22" strokeLinecap="round">
        <path d="M30 37 70 61" stroke={mono ? 'currentColor' : `url(#${id}c)`} opacity={mono ? 0.55 : 1} />
        <path d="M74 22 30 37" stroke={mono ? 'currentColor' : `url(#${id}a)`} />
        <path d="M70 61 26 77" stroke={mono ? 'currentColor' : `url(#${id}b)`} />
      </g>
      <path d="M50 37.500q1.400 10 11.500 11.500-10.100 1.500-11.500 11.500-1.400-10-11.500-11.500 10.100-1.500 11.500-11.500z" fill={mono ? '#070815' : '#fff'} />
    </svg>
  )
}
export function Wordmark({ size = 30, className, both }: { size?: number; className?: string; both?: boolean }) {
  return (
    <span dir="ltr" className={cn('inline-flex items-center gap-2.5 font-display font-bold tracking-tight', className)}>
      <Logo size={size} />
      <span style={{ fontSize: size * 0.62 }} className="leading-none">S<span className="grad-text">A</span>NDO</span>
      {both && <span style={{ fontSize: size * 0.56 }} className="border-s border-line ps-2.5 leading-none font-semibold text-fg/80">ساندو</span>}
    </span>
  )
}
