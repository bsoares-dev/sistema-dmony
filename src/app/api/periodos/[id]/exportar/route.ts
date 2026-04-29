import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // <-- A Vercel quer essa Promise aqui
) {
  try {
    // <-- E quer que a gente espere (await) o ID chegar aqui
    const { id } = await params;

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

    const cabecalho = [
      "Produto",
      "Cor",
      "Tamanho",
      "Estoque Inicial (EI)",
      "Produção (P)",
      "Estoque Atual (EA)",
      "Resultado Vendas (RV)",
    ];

    const linhas = itensEstoque.map((item: any) => [
      item.produto?.nome || "-",
      item.cor?.nome || "-",
      item.tamanho?.nome || "-",
      item.ei?.toString() || "0",
      item.p?.toString() || "0",
      item.ea?.toString() || "0",
      item.rv?.toString() || "0",
    ]);

    const conteudoCSV = [
      cabecalho.join(";"),
      ...linhas.map((linha: any[]) => linha.join(";")),
    ].join("\n");

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
