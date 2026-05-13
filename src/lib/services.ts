import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/lib/types";

export const FALLBACK_SERVICES: Service[] = [
  {
    id: "40fb0828-e778-4a87-bec2-c5ef80bc6390",
    slug: "avaliacao",
    name: "Avaliação Estética",
    description:
      "Avaliação completa do sorriso, face e necessidades clínicas para montar um plano de tratamento claro e personalizado.",
    duration_min: 45,
    price_text: "Gratuita",
    icon: "avaliacao",
    sort_order: 1,
    active: true,
  },
  {
    id: "71531c89-954d-41b2-b9de-357fd2899271",
    slug: "clareamento",
    name: "Clareamento Dental",
    description:
      "Protocolo profissional para clarear o sorriso com segurança, acompanhamento e resultado natural.",
    duration_min: 90,
    price_text: "Consultar",
    icon: "clareamento",
    sort_order: 2,
    active: true,
  },
  {
    id: "4e38440d-ba60-4f04-866c-1c1461dfe7c5",
    slug: "harmonizacao",
    name: "Harmonização Facial",
    description:
      "Planejamento estético facial para realçar traços, suavizar sinais e manter uma aparência equilibrada.",
    duration_min: 60,
    price_text: "Consultar",
    icon: "harmonizacao",
    sort_order: 3,
    active: true,
  },
  {
    id: "b0b3e216-f79f-4f06-b054-e7ef315778f0",
    slug: "limpeza",
    name: "Limpeza Dental",
    description:
      "Profilaxia e cuidados preventivos para saúde bucal, gengiva saudável e sensação de sorriso renovado.",
    duration_min: 60,
    price_text: "Consultar",
    icon: "limpeza",
    sort_order: 4,
    active: true,
  },
  {
    id: "db35b8fa-2507-495a-8f1c-8c0a2b037f43",
    slug: "profilaxia",
    name: "Profilaxia Clínica",
    description:
      "Prevenção, orientação e acompanhamento para manter sua saúde bucal em dia com conforto e precisão.",
    duration_min: 60,
    price_text: "Consultar",
    icon: "profilaxia",
    sort_order: 5,
    active: true,
  },
  {
    id: "af3c39b5-6f56-4544-8771-8b06d88f07a2",
    slug: "botox",
    name: "Botox",
    description:
      "Aplicação de toxina botulínica para suavizar linhas de expressão com técnica precisa e resultado discreto.",
    duration_min: 30,
    price_text: "Consultar",
    icon: "botox",
    sort_order: 6,
    active: true,
  },
  {
    id: "a6f02168-d9e7-4c4f-99da-9a5d5e7d65b6",
    slug: "preenchimento",
    name: "Preenchimento Facial",
    description:
      "Reposição de volume e contorno facial com foco em proporção, naturalidade e segurança.",
    duration_min: 60,
    price_text: "Consultar",
    icon: "preenchimento",
    sort_order: 7,
    active: true,
  },
  {
    id: "39f4587e-197b-441c-a81a-97c6da6d761a",
    slug: "facetas",
    name: "Facetas de Porcelana",
    description:
      "Solução estética para corrigir formato, desgaste, manchas e proporção dos dentes com alta previsibilidade.",
    duration_min: 120,
    price_text: "Consultar",
    icon: "facetas",
    sort_order: 8,
    active: true,
  },
  {
    id: "94e5cf4f-7b6f-4d45-a8e7-1ab43e75d11d",
    slug: "lentes",
    name: "Lentes de Contato Dental",
    description:
      "Laminados cerâmicos ultrafinos para transformar cor, formato e harmonia do sorriso com acabamento premium.",
    duration_min: 120,
    price_text: "Consultar",
    icon: "lentes",
    sort_order: 9,
    active: true,
  },
  {
    id: "c7bfecdb-02f0-4da6-b335-b8a34ff6c92e",
    slug: "personalizado",
    name: "Plano Personalizado",
    description:
      "Plano completo para organizar prioridades, etapas e expectativas do seu tratamento com clareza.",
    duration_min: 45,
    price_text: "Consultar",
    icon: "personalizado",
    sort_order: 10,
    active: true,
  },
];

export async function loadServices(limit?: number) {
  const fallback =
    typeof limit === "number" ? FALLBACK_SERVICES.slice(0, limit) : FALLBACK_SERVICES;

  try {
    const request = supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .limit(limit ?? 50);

    const timeout = new Promise<never>((_, reject) => {
      globalThis.setTimeout(
        () => reject(new Error("Tempo de resposta do Supabase excedido")),
        5500,
      );
    });

    const { data, error } = await Promise.race([request, timeout]);
    if (error || !data?.length) return fallback;
    return data as Service[];
  } catch {
    return fallback;
  }
}
