import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { custo, precoVarejo, precoAtacado } = body;

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        custo: Number(custo),
        precoVarejo: Number(precoVarejo),
        precoAtacado: Number(precoAtacado),
      },
    });

    return NextResponse.json({ success: true, data: produto });
  } catch (error) {
    console.error("Erro ao atualizar preços:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar os preços" },
      { status: 500 },
    );
  }
}
