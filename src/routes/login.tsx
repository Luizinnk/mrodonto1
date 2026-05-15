import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, LockKeyhole, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Acesso administrativo | MR Odontologia" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error("Email ou senha inválidos. Use recuperar senha ou crie a conta novamente.");
        return;
      }
      toast.success("Bem-vinda(o)!");
      navigate({ to: "/admin" });
      return;
    }

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Enviamos o link de recuperação para seu email.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: name },
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.user) {
      const { error: requestError } = await supabase.functions.invoke("request-admin-access", {
        body: {
          userId: data.user.id,
          email,
          name,
        },
      });

      if (requestError) {
        toast.warning(
          "Conta criada. A solicitação ficou pendente no banco, mas o envio de email precisa estar configurado no Supabase.",
        );
      } else {
        toast.success("Solicitação enviada para aprovação.");
      }
    }

    setLoading(false);
    setRequestSent(true);
  }

  return (
    <section className="clinical-grid grid min-h-[calc(100vh-72px)] place-items-center bg-[var(--ivory)] px-6 py-20">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-card p-10 shadow-[var(--shadow-luxe)] animate-fade-up">
        <div className="mb-8 text-center">
          <span className="section-kicker">Painel administrativo</span>
          <h1 className="mt-2 text-3xl">
            {mode === "signin" && "Entrar"}
            {mode === "signup" && "Criar conta"}
            {mode === "reset" && "Recuperar senha"}
          </h1>
        </div>

        {requestSent && (
          <div className="mb-6 rounded-2xl border border-[var(--clinical-light)] bg-[var(--clinical-light)]/60 p-5 text-sm text-[var(--clinical-strong)]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <MailCheck className="h-4 w-4" />
              Solicitação enviada
            </div>
            O acesso ao painel só será liberado depois da aprovação enviada para
            luiznovakiresner228@gmail.com.
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <input
              className="input"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode !== "reset" && (
            <input
              className="input"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}
          <button disabled={loading} className="btn-luxe justify-center disabled:opacity-50">
            {mode === "signin" ? (
              <LockKeyhole className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {loading && "Aguarde..."}
            {!loading && mode === "signin" && "Entrar"}
            {!loading && mode === "signup" && "Criar conta e solicitar aprovação"}
            {!loading && mode === "reset" && "Enviar link de recuperação"}
          </button>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {mode !== "signup" && (
              <button type="button" onClick={() => setMode("signup")} className="hover:text-foreground">
                Criar conta
              </button>
            )}
            {mode !== "reset" && (
              <button type="button" onClick={() => setMode("reset")} className="hover:text-foreground">
                Esqueci a senha
              </button>
            )}
            {mode !== "signin" && (
              <button type="button" onClick={() => setMode("signin")} className="hover:text-foreground">
                Entrar
              </button>
            )}
          </div>
        </form>
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Voltar ao site
          </Link>
        </div>
      </div>
      <style>{`.input{ width:100%; border:1.5px solid var(--color-border); background: var(--cream); padding:12px 16px; border-radius: 12px; font-size:14px; outline:none; transition: border-color .2s; }
        .input:focus{ border-color: var(--gold); }`}</style>
    </section>
  );
}
