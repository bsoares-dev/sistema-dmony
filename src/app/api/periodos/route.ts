import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BUSCAR PERÍODOS
export async function GET() {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: periodos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar períodos" },
      { status: 500 },
    );
  }
}

// CRIAR NOVO PERÍODO (A função que estava faltando!)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Descobre qual foi o último período criado para seguir a ordem
    const ultimoPeriodo = await prisma.periodo.findFirst({
      orderBy: { ordem: "desc" },
    });

    const novaOrdem = ultimoPeriodo ? ultimoPeriodo.ordem + 1 : 1;
    const nomePadrao = body.nome || `Período ${novaOrdem}`;

    // Cria o período no banco
    const novoPeriodo = await prisma.periodo.create({
      data: {
        nome: nomePadrao,
        status: "ABERTO",
        isBootstrap: novaOrdem === 1, // Se for o primeirão, marca como bootstrap
        ordem: novaOrdem,
      },
    });

    return NextResponse.json({ success: true, data: novoPeriodo });
  } catch (error) {
    console.error("Erro ao criar período:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao criar período" },
      { status: 500 },
    );
  }
}
