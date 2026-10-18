// Inline SVG payment-method badges for trust/compliance. Kept monochrome-friendly on
// a dark footer with small rounded cards.

function Badge({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      title={title}
      className="h-7 w-11 rounded-md bg-white flex items-center justify-center shadow-sm overflow-hidden"
    >
      {children}
    </div>
  )
}

export function VisaBadge() {
  return (
    <Badge title="Visa">
      <span className="text-[#1434CB] font-bold italic text-[13px] tracking-tight">VISA</span>
    </Badge>
  )
}

export function MastercardBadge() {
  return (
    <Badge title="Mastercard">
      <svg width="30" height="18" viewBox="0 0 30 18" aria-hidden>
        <circle cx="11" cy="9" r="7" fill="#EB001B" />
        <circle cx="19" cy="9" r="7" fill="#F79E1B" />
        <path d="M15 3.5a7 7 0 0 0 0 11 7 7 0 0 0 0-11Z" fill="#FF5F00" />
      </svg>
    </Badge>
  )
}

export function ApplePayBadge() {
  return (
    <Badge title="Apple Pay">
      <span className="text-black font-semibold text-[11px] flex items-center">
        <svg width="10" height="12" viewBox="0 0 14 17" className="mr-0.5" aria-hidden>
          <path
            d="M11.3 9.1c0-1.6 1.3-2.4 1.4-2.4-.8-1.1-2-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.1-.6c-1.1 0-2.1.6-2.7 1.6-1.1 2-.3 5 .8 6.6.5.8 1.2 1.7 2 1.6.8 0 1.1-.5 2.1-.5s1.3.5 2.1.5c.9 0 1.4-.8 2-1.6.4-.6.6-1.2.6-1.2s-1.4-.5-1.4-2.3ZM9.7 4.3c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.4-.7 1.1-.6 1.8.7.1 1.4-.3 1.8-.8Z"
            fill="#000"
          />
        </svg>
        Pay
      </span>
    </Badge>
  )
}

export function GooglePayBadge() {
  return (
    <Badge title="Google Pay">
      <span className="font-semibold text-[11px] flex items-center">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC04]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#34A853]">l</span>
        <span className="text-[#EA4335]">e</span>
        <span className="text-[#5F6368] ml-0.5">Pay</span>
      </span>
    </Badge>
  )
}

export function CryptoBadge() {
  return (
    <Badge title="Crypto">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#F7931A" />
        <path
          d="M16 10.3c.2-1.4-.9-2.2-2.4-2.7l.5-1.9-1.2-.3-.5 1.9c-.3-.1-.6-.1-.9-.2l.5-1.9-1.1-.3-.5 1.9-2.3-.6-.3 1.2s.9.2.8.2c.5.1.6.4.6.7l-1.3 5.3c-.1.2-.2.4-.6.3 0 0-.8-.2-.8-.2L4.7 16l2.2.5-.5 2 1.1.3.5-1.9c.3.1.6.2.9.2l-.5 1.9 1.2.3.5-2c2 .4 3.5.2 4.1-1.6.5-1.4 0-2.3-1-2.8.8-.2 1.3-.7 1.5-1.8Zm-2.7 3.7c-.4 1.4-2.7.6-3.5.5l.6-2.6c.8.2 3.2.6 2.9 2.1Zm.3-3.7c-.3 1.3-2.2.6-2.8.5l.6-2.3c.7.1 2.6.4 2.2 1.8Z"
          fill="#fff"
        />
      </svg>
    </Badge>
  )
}

export function PaymentBadges() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <VisaBadge />
      <MastercardBadge />
      <ApplePayBadge />
      <GooglePayBadge />
      <CryptoBadge />
    </div>
  )
}
