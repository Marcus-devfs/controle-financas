"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE = "financas_user";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function getUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const value = jar.get(AUTH_COOKIE)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user as SessionUser;
}

export async function loginUser(user: SessionUser) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
}

export async function logoutUser() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
}


