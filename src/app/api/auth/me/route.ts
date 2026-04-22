// src/app/api/auth/me/route.ts
// GET /api/auth/me
// Retorna o usuário atual a partir do cookie de sessão,
// sem modificar nem re-setar o cookie.
// Usado pelo frontend para restaurar o estado de auth no carregamento da página.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { success: false, error: "Erro ao obter usuário" },
      { status: 500 }
    );
  }
}
