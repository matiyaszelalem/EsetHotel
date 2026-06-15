export function TrustBar() {
  const companies = [
    'ACME CORP',
    'GLOBEX',
    'STARK INDUSTRIES',
    'WAYNE ENTERPRISES',
    'UMBRELLA CO',
    'CYBERDYNE',
  ]

  return (
    <section className="trust-bar w-full border-y border-border/60 bg-background px-6 py-12 sm:py-14 overflow-hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center">
        <h2 className="mb-8 sm:mb-10 text-center font-mono text-[10px] uppercase tracking-[4px] text-muted-foreground">
          Trusted by Industry-Leading Companies
        </h2>

        {/* Desktop: Static Flex Grid | Mobile: Marquee */}
        <div className="relative flex w-full max-w-[1000px] overflow-hidden lg:justify-center">
          <div className="flex w-max min-w-full animate-marquee items-center justify-around gap-12 lg:animate-none lg:justify-between lg:gap-8 lg:w-full">
            {companies.map((name, i) => (
              <span
                key={`group1-${i}`}
                className="whitespace-nowrap font-heading text-[15px] font-bold uppercase tracking-[2px] text-foreground/25 transition-all duration-200 hover:text-foreground/60 sm:text-[16px]"
              >
                {name}
              </span>
            ))}
            {/* Duplicated for mobile marquee seamless loop (hidden on lg) */}
            {companies.map((name, i) => (
              <span
                key={`group2-${i}`}
                className="whitespace-nowrap font-heading text-[15px] font-bold uppercase tracking-[2px] text-foreground/25 transition-all duration-200 hover:text-foreground/60 sm:text-[16px] lg:hidden"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
