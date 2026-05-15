export type PremiumIconName =
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

const altByIcon: Record<PremiumIconName, string> = {
  avaliacao: "Icone de avaliacao estetica",
  clareamento: "Icone de clareamento dental",
  harmonizacao: "Icone de harmonizacao facial",
  limpeza: "Icone de limpeza dental",
  profilaxia: "Icone de profilaxia clinica",
  botox: "Icone de toxina botulinica",
  preenchimento: "Icone de preenchimento facial",
  facetas: "Icone de facetas de porcelana",
  lentes: "Icone de lentes de contato dental",
  personalizado: "Icone de plano personalizado",
};

export function serviceIconName(slug: string) {
  return iconBySlug[slug] ?? "clareamento";
}

export function PremiumServiceIcon({
  slug,
  active = false,
  className = "",
}: {
  slug: string;
  active?: boolean;
  className?: string;
}) {
  const icon = serviceIconName(slug);
  return (
    <span
      className={`premium-service-icon ${active ? "premium-service-icon-active" : ""} ${className}`}
      aria-hidden="true"
    >
      <img src={`/mr-service-icons/${icon}.png`} alt={altByIcon[icon]} loading="lazy" />
    </span>
  );
}
