import { createAuthClient } from "better-auth/react";

// baseURL defaults to the current origin, which is what we want for a
// single self-hosted deployment.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
