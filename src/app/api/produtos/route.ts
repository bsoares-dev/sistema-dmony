import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// O GET: Vai à base de dados e traz todos os produtos para a lista do ecrã
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

// O POST: Recebe o que escreveste no ecrã e guarda na base de dados
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const produto = await prisma.produto.create({
      data: {
        nome: body.nome,
        grupoGrade: body.grupoGrade,
      },
    });
    return NextResponse.json({ success: true, data: produto });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao criar produto" },
      { status: 500 },
    );
  }
}
