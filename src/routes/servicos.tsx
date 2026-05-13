import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceCard } from "@/components/ServiceCard";
import { FALLBACK_SERVICES, loadServices } from "@/lib/services";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços | MR Odontologia Estética" },
      {
        name: "description",
        content:
          "Conheça nossos tratamentos: clareamento dental, harmonização facial, lentes de contato dental, botox e mais.",
      },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["services-all"],
    queryFn: () => loadServices(),
    placeholderData: FALLBACK_SERVICES,
  });

  const visibleServices = services?.length ? services : FALLBACK_SERVICES;

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="mb-16 text-center animate-fade-up">
        <span className="section-kicker">Nossos serviços</span>
        <h1 className="mb-4 mt-3 text-5xl md:text-6xl">Tratamentos que transformam</h1>
        <p className="mx-auto max-w-xl font-light text-muted-foreground">
          Procedimentos com tecnologia, estética natural e atendimento personalizado.
        </p>
      </div>

      {isLoading && !visibleServices.length && (
        <p className="text-center text-muted-foreground">Carregando tratamentos...</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
