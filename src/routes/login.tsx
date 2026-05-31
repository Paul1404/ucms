import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { client } from "@/lib/orpc";
import { fetchSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { needsSetup } = await client.meta.needsSetup();
    if (needsSetup) throw redirect({ to: "/setup" });
    const session = await fetchSession();
    if (session) throw redirect({ to: "/admin" });
  },
  head: () => ({ meta: [{ title: "Sign in" }] }),
  component: LoginPage,
});

const schema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email")),
  password: v.pipe(v.string(), v.minLength(1, "Enter your password")),
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = v.safeParse(schema, { email, password });
    if (!parsed.success) {
      toast.error(parsed.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not sign in");
      return;
    }
    await router.navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn /> {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-[var(--color-muted-foreground)]">
            <Link to="/" className="hover:underline">
              Back to site
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
