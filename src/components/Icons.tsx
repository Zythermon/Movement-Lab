type IconProps = { className?: string }

export function IconToday({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconHistory({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12a7 7 0 1 0 2-4.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 4.5V8h3.5M12 8.5V12l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSets({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="9" width="3.2" height="6" rx="1" fill="currentColor" />
      <rect x="6.2" y="6.2" width="2.6" height="11.6" rx="0.8" fill="currentColor" />
      <rect x="15.2" y="6.2" width="2.6" height="11.6" rx="0.8" fill="currentColor" />
      <rect x="18.3" y="9" width="3.2" height="6" rx="1" fill="currentColor" />
      <rect x="8.8" y="10.8" width="6.4" height="2.4" rx="1.2" fill="currentColor" />
    </svg>
  )
}

export function IconReps({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 8.4A5 5 0 0 1 16.4 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M16.4 4.8v3.6H12.8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M16.8 15.6A5 5 0 0 1 7.6 15.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M7.6 19.2v-3.6H11.2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12.4 10.2 16.5 18 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
