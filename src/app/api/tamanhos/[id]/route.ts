// src/app/api/tamanhos/[id]/route.ts
// GET    /api/tamanhos/[id]
// PATCH  /api/tamanhos/[id]  — atualiza nome, ordem ou ativo
// DELETE /api/tamanhos/[id]  — soft delete se tiver histórico
//
// ⚠️ PATCH não permite mudar o campo `grupo` — isso invalidaria
//    toda a grade histórica. Para mudar de grupo, desative e crie novo.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const tamanho = await prisma.tamanho.findUnique({ where: { id: params.id } });

    if (!tamanho) {
      return NextResponse.json(
        { success: false, error: "Tamanho não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tamanho });
  } catch (error) {
    console.error("[GET /api/tamanhos/[id]]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}

// Grupo não é editável via PATCH — ver comentário acima
const patchSchema = z.object({
  nome: z.string().min(1).max(20).optional(),
  ordem: z.number().int().nonnegative().optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum campo para atualizar" },
      { status: 400 }
    );
  }

  // Bloqueia tentativa de mudar o grupo via PATCH
  if ((body as any)?.grupo) {
    return NextResponse.json(
      {
        success: false,
        error:
          "O campo 'grupo' não pode ser alterado via PATCH. Desative este tamanho e crie um novo no grupo correto.",
      },
      { status: 422 }
    );
  }

  try {
    const tamanho = await prisma.tamanho.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ success: true, data: tamanho });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Tamanho não encontrado" },
        { status: 404 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Já existe um tamanho com este nome neste grupo" },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/tamanhos/[id]]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const totalVinculados = await prisma.estoquePeriodo.count({
      where: { tamanhoId: params.id },
    });

    if (totalVinculados > 0) {
      const tamanho = await prisma.tamanho.update({
        where: { id: params.id },
        data: { ativo: false },
      });
      return NextResponse.json({
        success: true,
        data: tamanho,
        message: `Tamanho desativado (${totalVinculados} registro(s) histórico(s) preservado(s))`,
      });
    }

    await prisma.tamanho.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, data: null, message: "Tamanho excluído" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Tamanho não encontrado" },
        { status: 404 }
      );
    }
    console.error("[DELETE /api/tamanhos/[id]]", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
