import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Colocamos o "context: any" para a Vercel parar de chorar com a tipagem
export async function PATCH(req: NextRequest, context: any) {
  // Extraímos o id de forma segura
  const params = await context.params;
  const id = params.id;

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
