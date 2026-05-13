import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/lib/types";
import { ServiceCard } from "@/components/ServiceCard";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços | MR Odontologia Estética" },
      { name: "description", content: "Conheça nossos tratamentos: clareamento dental, harmonização facial, lentes de contato dental, botox e mais." },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  return (
    <section className="py-24 px-6 max-w-[1280px] mx-auto">
      <div className="text-center mb-16 animate-fade-up">
        <span className="section-kicker">Nossos serviços</span>
        <h1 className="text-5xl md:text-6xl mt-3 mb-4">Tratamentos que transformam</h1>
        <p className="text-muted-foreground max-w-xl mx-auto font-light">
          Procedimentos com tecnologia, estética natural e atendimento personalizado.
        </p>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
