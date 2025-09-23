import Link from "next/link";
import { redirect } from "next/navigation";
import { loginUser, getUser } from "@/lib/auth";

async function register(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!email) return;
  await loginUser({ id: email, name: name || email.split("@")[0], email });
  redirect("/dashboard");
}

export default async function RegisterPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/10 p-6 bg-background">
        <h1 className="text-2xl font-semibold mb-2">Criar conta</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Comece a controlar suas finanças em poucos cliques.
        </p>
        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm">Nome</label>
            <input
              name="name"
              type="text"
              className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">E-mail</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="voce@exemplo.com"
            />
          </div>
          <button
            type="submit"
            className="w-full h-10 rounded-md bg-foreground text-background hover:opacity-90 transition"
          >
            Criar conta
          </button>
        </form>
        <div className="mt-6 text-sm">
          <span className="text-foreground/70">Já tem conta?</span>{" "}
          <Link className="underline" href="/login">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}


