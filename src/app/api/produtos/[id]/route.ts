// src/app/api/produtos/[id]/route.ts
// GET    /api/produtos/[id]  — busca um produto
// PATCH  /api/produtos/[id]  — atualiza nome ou grupoGrade
// DELETE /api/produtos/[id]  — desativa (soft delete via ativo=false)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface Params {
  params: { id: string };
}

// ── GET ───────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
    });

    if (!produto) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: produto });
  } catch (error) {
    console.error("[GET /api/produtos/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}

// ── PATCH ─────────────────────────────────────────────────────

const patchSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  grupoGrade: z
    .enum(["GRUPO_1", "GRUPO_2", "GRUPO_3", "GRUPO_4"])
    .optional(),
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

  // Não permite PATCH vazio
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum campo para atualizar" },
      { status: 400 }
    );
  }

  try {
    const produto = await prisma.produto.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: produto });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Já existe um produto com este nome" },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/produtos/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}

// ── DELETE (soft) ─────────────────────────────────────────────
// Não deleta fisicamente para preservar histórico de EstoquePeriodo.
// Apenas marca ativo = false.

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    // Verifica se há registros de estoque vinculados
    const totalVinculados = await prisma.estoquePeriodo.count({
      where: { produtoId: params.id },
    });

    if (totalVinculados > 0) {
      // Soft delete — preserva histórico
      const produto = await prisma.produto.update({
        where: { id: params.id },
        data: { ativo: false },
      });
      return NextResponse.json({
        success: true,
        data: produto,
        message: `Produto desativado (${totalVinculados} registro(s) histórico(s) preservado(s))`,
      });
    }

    // Sem histórico: pode deletar fisicamente
    await prisma.produto.delete({ where: { id: params.id } });
    return NextResponse.json({
      success: true,
      data: null,
      message: "Produto excluído",
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 }
      );
    }
    console.error("[DELETE /api/produtos/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
