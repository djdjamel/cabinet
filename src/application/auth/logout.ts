import { getSession } from "@infrastructure/auth/session";

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
