import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cores = await prisma.cor.findMany({
      orderBy: { ordem: "asc" },
    });
    return NextResponse.json({ success: true, data: cores });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar cores" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cor = await prisma.cor.create({
      data: {
        nome: body.nome,
        ordem: body.ordem,
      },
    });
    return NextResponse.json({ success: true, data: cor });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao criar cor" },
      { status: 500 },
    );
  }
}
