import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/server/auth";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

// Server function: resolves the current session from the request cookies.
// The handler body and its server-only imports are stripped from the client
// bundle by the TanStack Start compiler.
export const fetchSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ user: SessionUser } | null> => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return null;
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
        role: (session.user as { role?: string }).role ?? "member",
      },
    };
  },
);
