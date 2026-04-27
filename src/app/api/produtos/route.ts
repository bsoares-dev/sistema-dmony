import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// O GET: Vai à base de dados e traz todos os produtos (agora com preços incluídos)
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json({ success: true, data: produtos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}

// O POST: Recebe os dados do modal e guarda tudo no banco, incluindo o financeiro
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const produto = await prisma.produto.create({
      data: {
        nome: body.nome,
        grupoGrade: body.grupoGrade,
        // Adicionamos estas linhas para o cadastro já nascer com preços
        custo: Number(body.custo) || 0,
        precoVarejo: Number(body.precoVarejo) || 0,
        precoAtacado: Number(body.precoAtacado) || 0,
      },
    });

    return NextResponse.json({ success: true, data: produto });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar produto. Verifique se o nome já existe.",
      },
      { status: 500 },
    );
  }
}
