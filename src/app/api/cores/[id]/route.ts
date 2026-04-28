// src/app/api/cores/[id]/route.ts
// GET    /api/cores/[id]
// PATCH  /api/cores/[id]  — atualiza nome ou ordem
// DELETE /api/cores/[id]  — soft delete se tiver histórico

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(_req: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;

  try {
    const cor = await prisma.cor.findUnique({ where: { id } });

    if (!cor) {
      return NextResponse.json(
        { success: false, error: "Cor não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: cor });
  } catch (error) {
    console.error("[GET /api/cores/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  nome: z.string().min(1).max(80).optional(),
  ordem: z.number().int().nonnegative().optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Dados inválidos",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum campo para atualizar" },
      { status: 400 },
    );
  }

  try {
    const cor = await prisma.cor.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ success: true, data: cor });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Cor não encontrada" },
        { status: 404 },
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Já existe uma cor com este nome" },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/cores/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;

  try {
    const totalVinculados = await prisma.estoquePeriodo.count({
      where: { corId: id },
    });

    if (totalVinculados > 0) {
      const cor = await prisma.cor.update({
        where: { id },
        data: { ativo: false },
      });
      return NextResponse.json({
        success: true,
        data: cor,
        message: `Cor desativada (${totalVinculados} registro(s) histórico(s) preservado(s))`,
      });
    }

    await prisma.cor.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      data: null,
      message: "Cor excluída",
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Cor não encontrada" },
        { status: 404 },
      );
    }
    console.error("[DELETE /api/cores/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}
