import Link from "next/link";
import { redirect } from "next/navigation";
import { loginUser, getUser } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const name = email.split("@")[0] || "Usuário";

  if (!email) return;
  await loginUser({ id: email, name, email });
  redirect("/dashboard");
}

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/10 p-6 bg-background">
        <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
        <p className="text-sm text-foreground/70 mb-6">
          Acesse sua conta para gerenciar suas finanças.
        </p>
        <form action={login} className="space-y-4">
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
            Entrar
          </button>
        </form>
        <div className="mt-6 text-sm">
          <span className="text-foreground/70">Novo por aqui?</span>{" "}
          <Link className="underline" href="/register">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}


