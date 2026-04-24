import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ periodoId: string }> },
) {
  try {
    const { periodoId } = await params;

    const periodo = await prisma.periodo.findUnique({
      where: { id: periodoId },
    });

    if (!periodo) {
      return NextResponse.json(
        { success: false, error: "Período não encontrado" },
        { status: 404 },
      );
    }

    const registros = await prisma.estoquePeriodo.findMany({
      where: { periodoId },
      include: {
        produto: true,
        cor: true,
        tamanho: true,
      },
    });

    let totalEI = 0,
      totalP = 0,
      totalEA = 0,
      totalRV = 0;
    let completos = 0,
      pendentes = 0;
    const produtosMap = new Map();
    const alertas = [];

    for (const r of registros) {
      const ei = Number(r.ei);
      const p = Number(r.p);
      const ea = Number(r.ea);
      const rv = Number(r.rv);

      totalEI += ei;
      totalP += p;
      totalEA += ea;
      totalRV += rv;

      // Considera preenchido se a produção ou o estoque atual foram alterados
      if (p > 0 || ea > 0) completos++;
      else pendentes++;

      // Agrupa para fazer o Top Produtos
      if (!produtosMap.has(r.produtoId)) {
        produtosMap.set(r.produtoId, {
          produtoId: r.produtoId,
          produtoNome: r.produto.nome,
          totalRV: 0,
          totalP: 0,
          totalEA: 0,
        });
      }
      const pData = produtosMap.get(r.produtoId);
      pData.totalRV += rv;
      pData.totalP += p;
      pData.totalEA += ea;

      // Gera alertas se o estoque atual for menor ou igual a 5
      if (ea <= 5) {
        alertas.push({
          id: r.id,
          produtoNome: r.produto.nome,
          corNome: r.cor.nome,
          tamanhoNome: r.tamanho.nome,
          ea: ea,
          rv: rv,
        });
      }
    }

    // Pega os 5 produtos que mais venderam (maior RV)
    const topProdutos = Array.from(produtosMap.values())
      .sort((a, b) => b.totalRV - a.totalRV)
      .slice(0, 5);

    // Pega os 10 produtos com o estoque mais crítico
    alertas.sort((a, b) => a.ea - b.ea);
    const topAlertas = alertas.slice(0, 10);

    const uniqueProducts = new Set(registros.map((r) => r.produtoId)).size;

    return NextResponse.json({
      success: true,
      data: {
        periodo: periodo,
        resumoGeral: {
          totalProdutos: uniqueProducts,
          totalRegistros: registros.length,
          totalEI,
          totalP,
          totalEA,
          totalRV,
          registrosCompletos: completos,
          registrosPendentes: pendentes,
        },
        topProdutos,
        alertasEstoque: topAlertas,
        comparativo: {
          periodoAtualNome: periodo.nome,
          periodoAnteriorNome: null,
          rvAtual: totalRV,
          rvAnterior: null,
          variacaoPercent: null,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao gerar métricas do dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 },
    );
  }
}
