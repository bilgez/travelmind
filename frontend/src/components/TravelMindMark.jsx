export default function TravelMindMark({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 15.5 Q 12 10 18 6.8" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeDasharray="0.1 3.2" />
      <circle cx="12" cy="10.5" r="1.75" fill="currentColor" />
      <circle cx="18" cy="6.8" r="2.5" fill="currentColor" />
      <path d="M7.2 13.6L7.8 16.4L10.6 17L7.8 17.6L7.2 20.4L6.6 17.6L3.8 17L6.6 16.4Z"
            fill="currentColor" />
    </svg>
  )
}
