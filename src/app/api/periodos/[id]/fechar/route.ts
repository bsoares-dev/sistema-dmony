import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hasRole } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: periodoId } = await params;

  const user = getUserFromRequest(req);
  if (!hasRole(user, "GERENTE")) {
    return NextResponse.json(
      { success: false, error: "Acesso negado. Requer role GERENTE." },
      { status: 403 },
    );
  }

  try {
    const periodoAtual = await prisma.periodo.findUnique({
      where: { id: periodoId },
    });

    if (!periodoAtual) {
      return NextResponse.json(
        { success: false, error: "Período não encontrado" },
        { status: 404 },
      );
    }

    if (periodoAtual.status === "FECHADO") {
      return NextResponse.json(
        { success: false, error: "Período já está fechado (imutável)" },
        { status: 409 },
      );
    }

    const registros = await prisma.estoquePeriodo.findMany({
      where: { periodoId },
      include: {
        produto: { select: { nome: true } },
        cor: { select: { nome: true } },
        tamanho: { select: { nome: true } },
      },
    });

    if (registros.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum registro encontrado para este período",
        },
        { status: 422 },
      );
    }

    const registrosIncompletos = registros.filter((r) => {
      const pNum = Number(r.p);
      const eaNum = Number(r.ea);
      return pNum < 0 || eaNum < 0;
    });

    if (registrosIncompletos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Existem registros com valores negativos",
        },
        { status: 422 },
      );
    }

    const errosConsistencia: any[] = [];
    for (const r of registros) {
      const ei = Number(r.ei);
      const p = Number(r.p);
      const ea = Number(r.ea);
      const maxEA = ei + p;

      if (ea > maxEA) {
        errosConsistencia.push({
          id: r.id,
          produto: r.produto.nome,
          cor: r.cor.nome,
          tamanho: r.tamanho.nome,
          ei,
          p,
          ea,
          maxEA,
        });
      }
    }

    if (errosConsistencia.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `EA maior que EI+P em ${errosConsistencia.length} registro(s).`,
        },
        { status: 422 },
      );
    }

    // A mágica: Transação blindada e separada por lotes menores (Chunks)
    const resultado = await prisma.$transaction(
      async (tx) => {
        let totalRVCalculado = 0;

        // 1. Atualizar RV dividindo a carga (Chunks de 100)
        const chunkSize = 100;
        for (let i = 0; i < registros.length; i += chunkSize) {
          const chunk = registros.slice(i, i + chunkSize);

          // Atualiza esse pequeno lote todo de uma vez
          await Promise.all(
            chunk.map((r) => {
              const rv = Number(r.ei) + Number(r.p) - Number(r.ea);
              totalRVCalculado += rv;

              return tx.estoquePeriodo.update({
                where: { id: r.id },
                data: { rv },
              });
            }),
          );
        }

        // 2. Fechar período
        await tx.periodo.update({
          where: { id: periodoId },
          data: { status: "FECHADO" },
        });

        // 3. Criar Novo
        const novoPeriodo = await tx.periodo.create({
          data: {
            nome: `Período ${periodoAtual.ordem + 1}`,
            status: "ABERTO",
            isBootstrap: false,
            ordem: periodoAtual.ordem + 1,
          },
        });

        // 4. Inserir Herança
        const novosRegistros = registros.map((r) => ({
          periodoId: novoPeriodo.id,
          produtoId: r.produtoId,
          corId: r.corId,
          tamanhoId: r.tamanhoId,
          ei: Number(r.ea),
          p: 0,
          ea: 0,
          rv: 0,
          version: 1,
        }));

        for (let i = 0; i < novosRegistros.length; i += 300) {
          await tx.estoquePeriodo.createMany({
            data: novosRegistros.slice(i, i + 300),
            skipDuplicates: true,
          });
        }

        return {
          novoPeriodoId: novoPeriodo.id,
          novoPeriodoNome: novoPeriodo.nome,
          totalRV: totalRVCalculado,
        };
      },
      {
        maxWait: 10000,
        timeout: 60000, // 60 SEGUNDOS AGORA!
      },
    );

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error("Erro fatal ao fechar:", error);
    return NextResponse.json(
      { success: false, error: "Falha geral." },
      { status: 500 },
    );
  }
}
