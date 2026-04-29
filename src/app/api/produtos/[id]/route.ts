// src/app/api/produtos/[id]/route.ts
// GET    /api/produtos/[id]  — busca um produto
// PATCH  /api/produtos/[id]  — atualiza nome ou grupoGrade
// DELETE /api/produtos/[id]  — desativa (soft delete via ativo=false)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── GET ───────────────────────────────────────────────────────

export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const id = params.id;

  try {
    const produto = await prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: produto });
  } catch (error) {
    console.error("[GET /api/produtos/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}

// ── PATCH ─────────────────────────────────────────────────────

const patchSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  grupoGrade: z.enum(["GRUPO_1", "GRUPO_2", "GRUPO_3", "GRUPO_4"]).optional(),
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

  // Não permite PATCH vazio
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum campo para atualizar" },
      { status: 400 },
    );
  }

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: produto });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Produto não encontrado" },
        { status: 404 },
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Já existe um produto com este nome" },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/produtos/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}

// ── DELETE (soft) ─────────────────────────────────────────────
// Não deleta fisicamente para preservar histórico de EstoquePeriodo.
// Apenas marca ativo = false.

export async function DELETE(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { id } = params;

    // Em vez de deletar de verdade, a gente inativa o produto (Soft Delete)
    await prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({
      success: true,
      message: "Produto inativado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao inativar produto:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao inativar produto." },
      { status: 500 },
    );
  }
}
