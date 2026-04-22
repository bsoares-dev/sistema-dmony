import { NextRequest } from "next/server";

export async function getCurrentUser() {
  return { id: "1", nome: "Admin", role: "GERENTE" };
}

export function getUserFromRequest(req: NextRequest) {
  return { role: "GERENTE" };
}

export function hasRole(user: any, role: string) {
  return user?.role === role;
}
