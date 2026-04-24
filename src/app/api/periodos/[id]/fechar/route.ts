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

    if (!periodoAtual)
      return NextResponse.json(
        { success: false, error: "Período não encontrado" },
        { status: 404 },
      );
    if (periodoAtual.status === "FECHADO")
      return NextResponse.json(
        { success: false, error: "Período já está fechado (imutável)" },
        { status: 409 },
      );

    // Busca os registros SEM incluir as relações (tamanho/cor) para ficar ultra leve na memória
    const registros = await prisma.estoquePeriodo.findMany({
      where: { periodoId },
    });

    if (registros.length === 0)
      return NextResponse.json(
        { success: false, error: "Nenhum registro encontrado" },
        { status: 422 },
      );

    const registrosIncompletos = registros.filter(
      (r) => Number(r.p) < 0 || Number(r.ea) < 0,
    );
    if (registrosIncompletos.length > 0)
      return NextResponse.json(
        { success: false, error: "Existem registros com valores negativos" },
        { status: 422 },
      );

    const errosConsistencia: any[] = [];
    for (const r of registros) {
      const ei = Number(r.ei),
        p = Number(r.p),
        ea = Number(r.ea),
        maxEA = ei + p;
      if (ea > maxEA) {
        errosConsistencia.push({ id: r.id, maxEA }); // Simplificado para economizar RAM
      }
    }

    if (errosConsistencia.length > 0)
      return NextResponse.json(
        {
          success: false,
          error: `EA maior que EI+P em ${errosConsistencia.length} registro(s).`,
        },
        { status: 422 },
      );

    // =========================================================================
    // NOVA ABORDAGEM: FILA INDIANA (Zero travamento de memória)
    // =========================================================================

    // 1. Busca ou Cria Novo Período
    let novoPeriodo = await prisma.periodo.findFirst({
      where: { ordem: periodoAtual.ordem + 1 },
    });

    if (!novoPeriodo) {
      novoPeriodo = await prisma.periodo.create({
        data: {
          nome: `Período ${periodoAtual.ordem + 1}`,
          status: "ABERTO",
          isBootstrap: false,
          ordem: periodoAtual.ordem + 1,
        },
      });
    }

    // 2. Limpa registros parciais do novo período (caso a tentativa anterior tenha falhado no meio)
    await prisma.estoquePeriodo.deleteMany({
      where: { periodoId: novoPeriodo.id },
    });

    // 3. ATUALIZAÇÃO EM FILA INDIANA (Um por um, sem sobrecarregar a porta)
    let totalRVCalculado = 0;

    for (const r of registros) {
      const rv = Number(r.ei) + Number(r.p) - Number(r.ea);
      totalRVCalculado += rv;

      await prisma.estoquePeriodo.update({
        where: { id: r.id },
        data: { rv },
      });
    }

    // 4. Criação da Herança (Estoque Inicial do próximo mês)
    const novosRegistros = registros.map((r) => ({
      periodoId: novoPeriodo!.id,
      produtoId: r.produtoId,
      corId: r.corId,
      tamanhoId: r.tamanhoId,
      ei: Number(r.ea),
      p: 0,
      ea: 0,
      rv: 0,
      version: 1,
    }));

    // 5. Inserindo em lotes ultra seguros de 500 pra não bater limite de variáveis do SQLite
    for (let i = 0; i < novosRegistros.length; i += 500) {
      await prisma.estoquePeriodo.createMany({
        data: novosRegistros.slice(i, i + 500),
        skipDuplicates: true,
      });
    }

    // 6. Tranca o período atual com sucesso!
    await prisma.periodo.update({
      where: { id: periodoId },
      data: { status: "FECHADO" },
    });

    return NextResponse.json({
      success: true,
      data: {
        novoPeriodoId: novoPeriodo.id,
        novoPeriodoNome: novoPeriodo.nome,
        totalRV: totalRVCalculado,
      },
    });
  } catch (error) {
    console.error("Erro fatal ao fechar:", error);
    return NextResponse.json(
      { success: false, error: "Falha geral no servidor." },
      { status: 500 },
    );
  }
}
