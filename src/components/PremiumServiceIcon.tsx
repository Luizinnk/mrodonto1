type PremiumIconName =
  | "avaliacao"
  | "clareamento"
  | "harmonizacao"
  | "limpeza"
  | "profilaxia"
  | "botox"
  | "preenchimento"
  | "facetas"
  | "lentes"
  | "personalizado";

const iconBySlug: Record<string, PremiumIconName> = {
  avaliacao: "avaliacao",
  clareamento: "clareamento",
  harmonizacao: "harmonizacao",
  limpeza: "limpeza",
  profilaxia: "profilaxia",
  botox: "botox",
  preenchimento: "preenchimento",
  facetas: "facetas",
  lentes: "lentes",
  personalizado: "personalizado",
  plano: "personalizado",
};

export function serviceIconName(slug: string) {
  return iconBySlug[slug] ?? "clareamento";
}

export function PremiumServiceIcon({ slug, active = false, className = "" }: { slug: string; active?: boolean; className?: string }) {
  const icon = serviceIconName(slug);
  return (
    <span
      className={`premium-service-icon ${active ? "premium-service-icon-active" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" role="img">
        {icon === "avaliacao" && (
          <>
            <path d="M48 16a32 32 0 1 0 0 64 32 32 0 0 0 0-64Z" />
            <path d="M48 16v64M22 48h52M31 26c9 6 25 6 34 0M31 70c9-6 25-6 34 0" />
            <path d="M39 64c-4-4-6-9-6-16s2-12 6-16" />
          </>
        )}
        {icon === "clareamento" && (
          <>
            <path d="M33 28c7-8 13-3 15 0 2-3 8-8 15 0 7 9-3 32-8 42-2 4-6 4-8 0-2-5-4-9-6-14-2 5-4 9-6 14-2 4-6 4-8 0-5-10-15-33-8-42Z" />
            <path d="M62 22l4-9 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" />
            <path d="M22 68c11 7 41 7 52 0" />
          </>
        )}
        {icon === "harmonizacao" && (
          <>
            <path d="M45 18c-8 7-12 17-12 30 0 15 7 24 18 30" />
            <path d="M53 33c-5 1-8 4-9 8M56 51c-5 1-9 4-12 9" />
            <path d="M61 28c8 7 13 16 15 28M68 25l-7 3 2-8M73 44c5 5 8 10 10 18M79 42l-7 2 3-7" />
          </>
        )}
        {icon === "limpeza" && (
          <>
            <path d="M33 28c7-8 13-3 15 0 2-3 8-8 15 0 7 9-3 32-8 42-2 4-6 4-8 0-2-5-4-9-6-14-2 5-4 9-6 14-2 4-6 4-8 0-5-10-15-33-8-42Z" />
            <path d="M57 55a16 16 0 1 0 23 23L66 64" />
            <path d="M66 64l17 17" />
          </>
        )}
        {icon === "profilaxia" && (
          <>
            <path d="M48 14 75 26v20c0 17-11 28-27 36-16-8-27-19-27-36V26l27-12Z" />
            <path d="M36 41c5-7 10-3 12 0 2-3 7-7 12 0 5 7-2 23-6 30-2 3-5 3-6 0-1-3-2-6-3-9-1 3-2 6-3 9-1 3-4 3-6 0-4-7-11-23-6-30Z" />
          </>
        )}
        {icon === "botox" && (
          <>
            <path d="M22 68 52 38M44 30l22 22M52 22l22 22" />
            <path d="M18 72l8 8 12-12-8-8-12 12Z" />
            <path d="M56 18h18v18M62 74h17V56H62v18Z" />
          </>
        )}
        {icon === "preenchimento" && (
          <>
            <path d="M18 49c9-11 19-15 30-9 11-6 21-2 30 9-9 11-19 15-30 9-11 6-21 2-30-9Z" />
            <path d="M22 50c14 4 38 4 52 0" />
            <path d="M63 67 78 52M74 48l10 10M78 42l12 12" />
          </>
        )}
        {icon === "facetas" && (
          <>
            <path d="M24 28c6-7 12-3 15 0 3-3 9-7 15 0 6-7 12-3 15 0 7 8-2 30-6 39-2 4-6 4-8 0-2-4-3-8-5-13-2 5-3 9-5 13-2 4-6 4-8 0-2-4-3-8-5-13-2 5-3 9-5 13-2 4-6 4-8 0-4-9-13-31-6-39Z" />
          </>
        )}
        {icon === "lentes" && (
          <>
            <path d="M18 56c15-20 36-29 60-25-12 17-31 29-56 33" />
            <path d="M29 55c16-1 30-6 42-17" />
            <path d="M71 24l3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
          </>
        )}
        {icon === "personalizado" && (
          <>
            <path d="M30 20h36v58H30V20Z" />
            <path d="M40 31h16M40 62h16M40 70h16" />
            <path d="M42 46c3-5 7-2 8 0 1-2 5-5 8 0 3 5-2 14-5 18-1 2-3 2-4 0-1-2-2-4-3-7-1 3-2 5-3 7-1 2-3 2-4 0-3-4-8-13-5-18Z" />
          </>
        )}
      </svg>
    </span>
  );
}
