import { NextRequest } from "next/server";

export function getUserFromRequest(req: NextRequest) {
  // Simula que você é o GERENTE para poder testar tudo sem bloqueios
  return { role: "GERENTE" };
}

export function hasRole(user: any, role: string) {
  return user?.role === role;
}
