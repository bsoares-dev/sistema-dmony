import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: periodos });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar: " + error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Tentativa de criação super simples, sem firulas, pra não bater em colunas inexistentes
    const novoPeriodo = await prisma.periodo.create({
      data: {
        nome: body.nome || "Novo Período",
        status: "ABERTO",
      },
    });

    return NextResponse.json({ success: true, data: novoPeriodo });
  } catch (error: any) {
    // O PULO DO GATO: Devolve o erro real do banco direto pro seu navegador!
    return NextResponse.json(
      {
        success: false,
        error: "O Prisma dedurou: " + String(error.message || error),
      },
      { status: 500 },
    );
  }
}
