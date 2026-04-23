import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ periodoId: string }> }, // AVISAMOS QUE É UMA PROMISE
) {
  try {
    // ABRINDO A CAIXA COM AWAIT:
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

    const produtos = await prisma.produto.findMany({ where: { ativo: true } });
    const cores = await prisma.cor.findMany({ where: { ativo: true } });
    const tamanhos = await prisma.tamanho.findMany({ where: { ativo: true } });

    let criados = 0;

    for (const produto of produtos) {
      const tamanhosDoProduto = tamanhos.filter(
        (t) => t.grupo === produto.grupoGrade,
      );

      for (const cor of cores) {
        for (const tamanho of tamanhosDoProduto) {
          const existe = await prisma.estoquePeriodo.findFirst({
            where: {
              periodoId: periodo.id,
              produtoId: produto.id,
              corId: cor.id,
              tamanhoId: tamanho.id,
            },
          });

          if (!existe) {
            await prisma.estoquePeriodo.create({
              data: {
                periodoId: periodo.id,
                produtoId: produto.id,
                corId: cor.id,
                tamanhoId: tamanho.id,
                p: 0,
                ea: 0,
                ei: 0,
                rv: 0,
                version: 1,
              },
            });
            criados++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        criados,
        message:
          criados > 0
            ? `Sucesso! ${criados} novos itens adicionados à grade.`
            : "A grade já está 100% sincronizada com os produtos.",
      },
    });
  } catch (error) {
    console.error("Erro ao sincronizar:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao sincronizar" },
      { status: 500 },
    );
  }
}
