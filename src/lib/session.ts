import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSession, deleteSession, userFromSession, type User } from "./auth";

const SESSION = "tb_session";
const PENDING = "tb_otp";

const secure = () => process.env.NODE_ENV === "production";

export async function setSessionCookie(userId: string) {
  const token = await createSession(userId);
  (await cookies()).set(SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secure(),
    path: "/",
    maxAge: 30 * 86_400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION)?.value;
  if (token) await deleteSession(token);
  jar.delete(SESSION);
}

export async function setPending(otpId: string) {
  (await cookies()).set(PENDING, otpId, { httpOnly: true, sameSite: "lax", secure: secure(), path: "/", maxAge: 600 });
}

export async function getPending(): Promise<string | null> {
  return (await cookies()).get(PENDING)?.value ?? null;
}

export async function clearPending() {
  (await cookies()).delete(PENDING);
}

/** The signed-in user for this request, or null. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION)?.value;
  return token ? userFromSession(token) : null;
});

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/signin");
  return user;
}
