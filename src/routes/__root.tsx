import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-serif text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">Página não encontrada.</p>
        <Link to="/" className="btn-luxe mt-6">Voltar para o início</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-serif">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
        <a href="/" className="btn-luxe mt-6">Início</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MR Odontologia Estética | Agende seu horário" },
      { name: "description", content: "Clínica premium de odontologia estética. Clareamento, harmonização facial, lentes de contato dental e mais. Agende online." },
      { property: "og:title", content: "MR Odontologia Estética | Agende seu horário" },
      { name: "twitter:title", content: "MR Odontologia Estética | Agende seu horário" },
      { property: "og:description", content: "Clínica premium de odontologia estética. Clareamento, harmonização facial, lentes de contato dental e mais. Agende online." },
      { name: "twitter:description", content: "Clínica premium de odontologia estética. Clareamento, harmonização facial, lentes de contato dental e mais. Agende online." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/sZeGaXsEiOaEQY6HxPx5P7npeDt1/social-images/social-1778529461561-ChatGPT_Image_11_de_mai._de_2026,_16_57_37.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/sZeGaXsEiOaEQY6HxPx5P7npeDt1/social-images/social-1778529461561-ChatGPT_Image_11_de_mai._de_2026,_16_57_37.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <IntroSplash />
      <Header />
      <main className="pt-[88px]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 4300);
    const hideTimer = window.setTimeout(() => setVisible(false), 5050);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-splash ${leaving ? "intro-splash-exit" : ""}`} aria-hidden="true">
      <video
        className="intro-splash-video"
        src="/mr-brand/intro-dental.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => {
          setLeaving(true);
          window.setTimeout(() => setVisible(false), 750);
        }}
        onError={() => setVisible(false)}
      />
      <div className="intro-splash-shade" />
      <div className="intro-splash-brand">
        <img src="/mr-brand/logo-compact.png" alt="" />
        <span>Odontologia & Estética</span>
      </div>
    </div>
  );
}
