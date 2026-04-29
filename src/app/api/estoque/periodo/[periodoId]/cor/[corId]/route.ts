import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salvarRascunhoSchema } from "@/lib/validations";
import type { ConflictItem, ProdutoGrade } from "@/types";

export async function GET(_req: NextRequest, context: any) {
  const params = await context.params;
  const { periodoId, corId } = params;

  try {
    const [periodo, cor, registros] = await Promise.all([
      prisma.periodo.findUnique({ where: { id: periodoId } }),
      prisma.cor.findUnique({ where: { id: corId } }),
      prisma.estoquePeriodo.findMany({
        where: { periodoId, corId },
        include: {
          produto: { select: { id: true, nome: true, grupoGrade: true } },
          tamanho: { select: { id: true, nome: true, ordem: true } },
        },
        orderBy: [{ produto: { nome: "asc" } }, { tamanho: { ordem: "asc" } }],
      }),
    ]);

    if (!periodo) {
      return NextResponse.json(
        { success: false, error: "Período não encontrado" },
        { status: 404 },
      );
    }

    if (!cor) {
      return NextResponse.json(
        { success: false, error: "Cor não encontrada" },
        { status: 404 },
      );
    }

    const produtosMap = new Map<string, ProdutoGrade>();

    for (const r of registros) {
      if (!produtosMap.has(r.produtoId)) {
        produtosMap.set(r.produtoId, {
          produtoId: r.produtoId,
          produtoNome: r.produto.nome,
          grupoGrade: r.produto.grupoGrade as any,
          items: [],
        });
      }

      produtosMap.get(r.produtoId)!.items.push({
        id: r.id,
        periodoId: r.periodoId,
        produtoId: r.produtoId,
        corId: r.corId,
        tamanhoId: r.tamanhoId,
        tamanhoNome: r.tamanho.nome,
        tamanhoOrdem: r.tamanho.ordem,
        ei: Number(r.ei),
        p: Number(r.p),
        ea: Number(r.ea),
        rv: Number(r.rv),
        version: r.version,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        periodoId,
        corId,
        corNome: cor.nome,
        periodoNome: periodo.nome,
        periodoStatus: periodo.status,
        isBootstrap: periodo.isBootstrap,
        produtos: Array.from(produtosMap.values()),
      },
    });
  } catch (error) {
    console.error("[GET /api/estoque/periodo/[periodoId]/cor/[corId]]", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar dados de estoque" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  const params = await context.params;
  const { periodoId, corId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido no corpo da requisição" },
      { status: 400 },
    );
  }

  const parsed = salvarRascunhoSchema.safeParse(body);
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

  const { items } = parsed.data;

  try {
    const periodo = await prisma.periodo.findUnique({
      where: { id: periodoId },
    });

    if (!periodo) {
      return NextResponse.json(
        { success: false, error: "Período não encontrado" },
        { status: 404 },
      );
    }

    if (periodo.status === "FECHADO") {
      return NextResponse.json(
        {
          success: false,
          error: "Período FECHADO é imutável. Nenhuma alteração foi salva.",
        },
        { status: 409 },
      );
    }

    const ids = items.map((i) => i.id);
    const registrosAtuais = await prisma.estoquePeriodo.findMany({
      where: { id: { in: ids }, periodoId, corId },
      select: { id: true, version: true },
    });

    if (registrosAtuais.length !== ids.length) {
      const encontrados = new Set(registrosAtuais.map((r) => r.id));
      const naoEncontrados = ids.filter((id) => !encontrados.has(id));
      return NextResponse.json(
        {
          success: false,
          error: "Alguns registros não foram encontrados",
          details: naoEncontrados,
        },
        { status: 404 },
      );
    }

    const versionMap = new Map(registrosAtuais.map((r) => [r.id, r.version]));

    const conflitos: ConflictItem[] = [];
    for (const item of items) {
      const versionServidor = versionMap.get(item.id)!;
      if (item.version !== versionServidor) {
        conflitos.push({
          id: item.id,
          versionCliente: item.version,
          versionServidor,
        });
      }
    }

    if (conflitos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Conflito de versão detectado em ${conflitos.length} registro(s). Recarregue a página e tente novamente.`,
          conflictItems: conflitos,
        },
        { status: 409 },
      );
    }

    const atualizados = await prisma.$transaction(
      items.map((item) => {
        const updateData: Record<string, unknown> = {
          p: item.p,
          ea: item.ea,
          version: { increment: 1 },
        };

        // AQUI CAIU A ÚLTIMA TRAVA! Agora aceita o 'ei' independente do isBootstrap
        if (item.ei !== undefined) {
          updateData.ei = item.ei;
        }

        return prisma.estoquePeriodo.update({
          where: {
            id: item.id,
            periodoId,
            corId,
            version: item.version,
          },
          data: updateData,
          select: {
            id: true,
            ei: true,
            p: true,
            ea: true,
            rv: true,
            version: true,
          },
        });
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        updated: atualizados.length,
        items: atualizados.map((r) => ({
          ...r,
          ei: Number(r.ei),
          p: Number(r.p),
          ea: Number(r.ea),
          rv: Number(r.rv),
          version: r.version,
        })),
      },
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Conflito detectado durante a gravação. Recarregue e tente novamente.",
        },
        { status: 409 },
      );
    }

    console.error("[PUT /api/estoque/periodo/[periodoId]/cor/[corId]]", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao salvar rascunho" },
      { status: 500 },
    );
  }
}
