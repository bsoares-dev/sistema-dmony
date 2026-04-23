import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tamanhos = await prisma.tamanho.findMany({
      orderBy: { ordem: "asc" },
    });
    return NextResponse.json({ success: true, data: tamanhos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar tamanhos" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tamanho = await prisma.tamanho.create({
      data: {
        nome: body.nome,
        grupo: body.grupo,
        ordem: body.ordem,
      },
    });
    return NextResponse.json({ success: true, data: tamanho });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao criar tamanho" },
      { status: 500 },
    );
  }
}
