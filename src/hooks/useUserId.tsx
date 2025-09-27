"use client";

import { createContext, useContext } from "react";

const UserContext = createContext<{ userId: string } | null>(null);

export function useUserId() {
  const context = useContext(UserContext);
  return context?.userId || "";
}

export { UserContext };
