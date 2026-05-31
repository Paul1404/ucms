import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { client } from "@/lib/orpc";

export const Route = createFileRoute("/setup")({
  beforeLoad: async () => {
    const { needsSetup } = await client.meta.needsSetup();
    if (!needsSetup) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "ucms einrichten" }] }),
  component: SetupPage,
});

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Bitte Namen eingeben")),
  email: v.pipe(v.string(), v.email("Bitte eine gültige E-Mail eingeben")),
  password: v.pipe(v.string(), v.minLength(8, "Mindestens 8 Zeichen verwenden")),
});

function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = v.safeParse(schema, { name, email, password });
    if (!parsed.success) {
      toast.error(parsed.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Konto konnte nicht erstellt werden");
      return;
    }
    toast.success("Administrator-Konto erstellt");
    await router.navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Willkommen bei ucms</CardTitle>
          <CardDescription>
            Lege das Administrator-Konto an. Das ist nur einmal nötig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus /> {loading ? "Wird erstellt..." : "Administrator-Konto erstellen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
