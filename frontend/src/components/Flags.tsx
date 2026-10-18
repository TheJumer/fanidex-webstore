// Clean inline SVG flag icons. Country-flag emojis do not render on Windows browsers,
// so we draw them as SVG to guarantee consistent cross-platform display.

export function FlagEN({ size = 18 }: { size?: number }) {
  // UK Union Jack.
  return (
    <svg width={size} height={(size * 3) / 4} viewBox="0 0 60 30" className="rounded-[2px] shrink-0">
      <clipPath id="uk-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-clip)" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}

export function FlagUA({ size = 18 }: { size?: number }) {
  // Ukrainian flag: blue over yellow.
  return (
    <svg width={size} height={(size * 3) / 4} viewBox="0 0 60 30" className="rounded-[2px] shrink-0">
      <rect width="60" height="15" fill="#0057B7" />
      <rect y="15" width="60" height="15" fill="#FFDD00" />
    </svg>
  )
}

export function LangFlag({ lang, size = 18 }: { lang: 'en' | 'ua'; size?: number }) {
  return lang === 'ua' ? <FlagUA size={size} /> : <FlagEN size={size} />
}
