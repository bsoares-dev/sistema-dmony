import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // 1. CORREÇÃO: Usando o nome exato do modelo (estoquePeriodo)
    const itensEstoque = await prisma.estoquePeriodo.findMany({
      where: { periodoId: id },
      include: {
        produto: true,
        cor: true,
        tamanho: true,
      },
    });

    if (!itensEstoque || itensEstoque.length === 0) {
      return new NextResponse("Nenhum dado encontrado para exportar.", {
        status: 400,
      });
    }

    // 2. CABEÇALHO: Adaptado para a sua fórmula EI + P - EA = RV
    const cabecalho = [
      "Produto",
      "Cor",
      "Tamanho",
      "Estoque Inicial (EI)",
      "Produção (P)",
      "Estoque Atual (EA)",
      "Resultado Vendas (RV)",
    ];

    // 3. LINHAS: Mapeando os campos reais do seu banco
    const linhas = itensEstoque.map((item: any) => [
      item.produto?.nome || "-",
      item.cor?.nome || "-",
      item.tamanho?.nome || "-",
      item.ei?.toString() || "0",
      item.p?.toString() || "0",
      item.ea?.toString() || "0",
      item.rv?.toString() || "0",
    ]);

    // 4. CORREÇÃO TS: Adicionado : any[] para o TypeScript não reclamar do .join
    const conteudoCSV = [
      cabecalho.join(";"),
      ...linhas.map((linha: any[]) => linha.join(";")),
    ].join("\n");

    // 5. RESPOSTA: Força o download  com o nome certo
    return new NextResponse("\uFEFF" + conteudoCSV, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="estoque-dmony.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Erro no CSV:", error);
    return new NextResponse("Erro ao gerar CSV: " + error.message, {
      status: 500,
    });
  }
}
