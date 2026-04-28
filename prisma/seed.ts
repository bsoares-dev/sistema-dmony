// ============================================================
// SEED — Catálogo Oficial Dmony Moda Íntima
// Popula: Cores, Tamanhos por Grupo, Produtos por Grupo,
//         Período Bootstrap + EstoquePeriodo (estrutura zerada)
// ============================================================

import { PrismaClient, Decimal } from "@prisma/client";

const prisma = new PrismaClient();

// ------------------------------------------------------------
// DADOS DE REFERÊNCIA
// ------------------------------------------------------------
// @ts-nocheck
const CORES = [
  { nome: "Branca", ordem: 1 },
  { nome: "Preta", ordem: 2 },
  { nome: "Nude", ordem: 3 },
  { nome: "Satin", ordem: 4 },
  { nome: "Divino", ordem: 5 },
  { nome: "Chocolate", ordem: 6 },
  { nome: "Marinho", ordem: 7 },
  { nome: "Cuecas", ordem: 8 },
  { nome: "Cotton", ordem: 9 },
  { nome: "Reforçado", ordem: 10 },
  { nome: "Tule-Sensual", ordem: 11 },
  { nome: "Onça", ordem: 12 },
  { nome: "Azul Frozen", ordem: 13 },
  { nome: "Pink", ordem: 14 },
  { nome: "Amarelo", ordem: 15 },
  { nome: "Verão", ordem: 16 },
  { nome: "Inverno", ordem: 17 },
];

// GRUPO_1: Grade numérica com liso/bolha + numeração grande
const TAMANHOS_GRUPO_1 = [
  { nome: "38 liso", ordem: 1 },
  { nome: "38 bolha", ordem: 2 },
  { nome: "40 liso", ordem: 3 },
  { nome: "40 bolha", ordem: 4 },
  { nome: "42 liso", ordem: 5 },
  { nome: "42 bolha", ordem: 6 },
  { nome: "44 liso", ordem: 7 },
  { nome: "44 bolha", ordem: 8 },
  { nome: "46", ordem: 9 },
  { nome: "48", ordem: 10 },
  { nome: "50", ordem: 11 },
  { nome: "52", ordem: 12 },
  { nome: "54", ordem: 13 },
];

// GRUPO_2: Grade numérica simples
const TAMANHOS_GRUPO_2 = [
  { nome: "42", ordem: 1 },
  { nome: "44", ordem: 2 },
  { nome: "46", ordem: 3 },
  { nome: "48", ordem: 4 },
  { nome: "50", ordem: 5 },
  { nome: "52", ordem: 6 },
  { nome: "54", ordem: 7 },
];

// GRUPO_3: Grade alfabética com XGG
const TAMANHOS_GRUPO_3 = [
  { nome: "P", ordem: 1 },
  { nome: "M", ordem: 2 },
  { nome: "G", ordem: 3 },
  { nome: "GG", ordem: 4 },
  { nome: "XGG", ordem: 5 },
];

// GRUPO_4: Grade alfabética curta (sem XGG)
const TAMANHOS_GRUPO_4 = [
  { nome: "P", ordem: 1 },
  { nome: "M", ordem: 2 },
  { nome: "G", ordem: 3 },
  { nome: "GG", ordem: 4 },
];

// GRUPO_1 — Sutiãs e Corpets com grade completa liso/bolha
const PRODUTOS_GRUPO_1 = [
  "Sutiã Alice",
  "Sutiã Heloise",
  "Sutiã Laís",
  "Sutiã Meg",
  "Sutiã Micro Bojo c/ Base",
  "Sutiã Thais 1",
  "Sutiã Carol",
  "Sutiã Karen",
  "Sutiã Micro Bojo Cruzado 1 sem base",
  "Sutiã Micro Bojo Cruzado Com Base",
  "Sutiã Nadador Com Base Trad",
  "Sutiã Nadador Com Base Extra",
  "Sutiã Nadador Sem Base",
  "Sutiã Paty",
  "Sutiã TQC Domitila",
  "Sutiã TQC Micro Trad",
  "Sutiã TQC Micro Extra",
  "Cropped Fernanda",
  "Corpet Letícia Renda",
  "Corpet Meg Comprido",
  "Corpet Meg Forrado",
  "Corpet Micro Bojo c/ alça",
];

// GRUPO_2 — Sutiãs com grade numérica simples
const PRODUTOS_GRUPO_2 = [
  "Sutiã Bella",
  "Sutiã Mel",
  "Sutiã Sara c/ aro",
  "Sutiã Vitória",
  "Top Sara Renda",
  "Sutiã Olga",
  "Sutiã Carla Plus Size",
];

// GRUPO_3 — Tangas e Shorts com grade P/M/G/GG/XGG
const PRODUTOS_GRUPO_3 = [
  "Tanga Alice",
  "Tanga Lais Fio Duplo",
  "Tanga Leticia Fio Duplo",
  "Tanga Mariah Fio Duplo",
  "Tanga Mariah Trad",
  "Tanga Meg",
  "Tanga Micro 1",
  "Tanga Micro 2",
  "Tanga Micro 3",
  "Tanga Micro Fio Duplo",
  "Tanga Micro Tirinha Fio",
  "Tanga Micro Tirinha Trad",
  "Tanga Nataly",
  "Tanga Paloma Fio Duplo",
  "Tanga Sara Renda Fio",
  "Tanga Scarlet 1",
  "Tanga Scarlet 2",
  "Tanga Scarlet Fio Duplo",
  "Tanga Taina 1",
  "Tanga Taina Fio Duplo",
  "Tanga Thais Fio Duplo",
  "Tanga Thais Tirinha Fio Duplo",
  "Tanga Vitória 2 Fio Duplo",
  "Short Gabriela",
];

// GRUPO_4 — Tangões e Boxer com grade P/M/G/GG
const PRODUTOS_GRUPO_4 = [
  "Tangão Celina",
  "Tangão Diva",
  "Calc Boxer Alta adulto",
];

// ------------------------------------------------------------
// SEED MAIN
// ------------------------------------------------------------

async function main() {
  console.log("🌱 Iniciando seed — Dmony Moda Íntima...\n");

  // ----------------------------------------------------------
  // 1. CORES
  // ----------------------------------------------------------
  console.log("→ Criando cores...");
  await prisma.cor.createMany({
    data: CORES,
    skipDuplicates: true,
  });
  const coresCriadas = await prisma.cor.findMany({ orderBy: { ordem: "asc" } });
  console.log(`  ✔ ${coresCriadas.length} cores criadas`);

  // ----------------------------------------------------------
  // 2. TAMANHOS
  // ----------------------------------------------------------
  console.log("→ Criando tamanhos por grupo...");

  await prisma.tamanho.createMany({
    data: TAMANHOS_GRUPO_1.map((t) => ({ ...t, grupo: "GRUPO_1" })),
    skipDuplicates: true,
  });
  await prisma.tamanho.createMany({
    data: TAMANHOS_GRUPO_2.map((t) => ({ ...t, grupo: "GRUPO_2" })),
    skipDuplicates: true,
  });
  await prisma.tamanho.createMany({
    data: TAMANHOS_GRUPO_3.map((t) => ({ ...t, grupo: "GRUPO_3" })),
    skipDuplicates: true,
  });
  await prisma.tamanho.createMany({
    data: TAMANHOS_GRUPO_4.map((t) => ({ ...t, grupo: "GRUPO_4" })),
    skipDuplicates: true,
  });

  const tamanhosPorGrupo = await prisma.tamanho.groupBy({
    by: ["grupo"],
    _count: true,
  });
  tamanhosPorGrupo.forEach((g) =>
    console.log(`  ✔ ${g.grupo}: ${g._count} tamanhos`),
  );

  // ----------------------------------------------------------
  // 3. PRODUTOS
  // ----------------------------------------------------------
  console.log("→ Criando produtos...");

  await prisma.produto.createMany({
    data: PRODUTOS_GRUPO_1.map((nome) => ({ nome, grupoGrade: "GRUPO_1" })),
    skipDuplicates: true,
  });
  await prisma.produto.createMany({
    data: PRODUTOS_GRUPO_2.map((nome) => ({ nome, grupoGrade: "GRUPO_2" })),
    skipDuplicates: true,
  });
  await prisma.produto.createMany({
    data: PRODUTOS_GRUPO_3.map((nome) => ({ nome, grupoGrade: "GRUPO_3" })),
    skipDuplicates: true,
  });
  await prisma.produto.createMany({
    data: PRODUTOS_GRUPO_4.map((nome) => ({ nome, grupoGrade: "GRUPO_4" })),
    skipDuplicates: true,
  });

  const produtosPorGrupo = await prisma.produto.groupBy({
    by: ["grupoGrade"],
    _count: true,
  });
  produtosPorGrupo.forEach((g) =>
    console.log(`  ✔ ${g.grupoGrade}: ${g._count} produtos`),
  );

  // ----------------------------------------------------------
  // 4. PERÍODO BOOTSTRAP (Período 1)
  // ----------------------------------------------------------
  console.log("→ Criando período bootstrap...");

  const periodoExistente = await prisma.periodo.findFirst({
    where: { isBootstrap: true },
  });

  if (periodoExistente) {
    console.log("  ⚠ Período bootstrap já existe, pulando criação de período.");
    console.log("\n✅ Seed concluído (parcial — período já existia).");
    return;
  }

  const periodo = await prisma.periodo.create({
    data: {
      nome: "Período 1 — Bootstrap",
      status: "ABERTO",
      isBootstrap: true,
      ordem: 1,
    },
  });
  console.log(`  ✔ Período criado: "${periodo.nome}" (id: ${periodo.id})`);

  // ----------------------------------------------------------
  // 5. ESTOQUE_PERIODO — Estrutura zerada para todas as combinações
  //    produto × cor × tamanho (respeitando o grupo de cada produto)
  // ----------------------------------------------------------
  console.log(
    "→ Criando registros de estoque (estrutura zerada para bootstrap)...",
  );

  const produtos = await prisma.produto.findMany({ where: { ativo: true } });
  const cores = await prisma.cor.findMany({ where: { ativo: true } });
  const tamanhos = await prisma.tamanho.findMany({ where: { ativo: true } });

  // Mapeia grupo → tamanhos
  const tamanhosPorGrupoMap = new Map<string, typeof tamanhos>();
  for (const t of tamanhos) {
    if (!tamanhosPorGrupoMap.has(t.grupo)) {
      tamanhosPorGrupoMap.set(t.grupo, []);
    }
    tamanhosPorGrupoMap.get(t.grupo)!.push(t);
  }

  const registros: {
    periodoId: string;
    produtoId: string;
    corId: string;
    tamanhoId: string;
    ei: number;
    p: number;
    ea: number;
    rv: number;
    version: number;
  }[] = [];

  for (const produto of produtos) {
    const tamanhosDoGrupo = tamanhosPorGrupoMap.get(produto.grupoGrade) ?? [];

    for (const cor of cores) {
      for (const tamanho of tamanhosDoGrupo) {
        registros.push({
          periodoId: periodo.id,
          produtoId: produto.id,
          corId: cor.id,
          tamanhoId: tamanho.id,
          ei: 0,
          p: 0,
          ea: 0,
          rv: 0,
          version: 1,
        });
      }
    }
  }

  // Insere em lotes de 500 para não sobrecarregar o banco
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < registros.length; i += BATCH_SIZE) {
    const batch = registros.slice(i, i + BATCH_SIZE);
    await prisma.estoquePeriodo.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += batch.length;
    process.stdout.write(
      `\r  Inserindo registros... ${inserted}/${registros.length}`,
    );
  }

  console.log(`\n  ✔ ${registros.length} registros de EstoquePeriodo criados`);

  // Resumo final
  const totalProdutos = await prisma.produto.count();
  const totalCores = await prisma.cor.count();
  const totalTamanhos = await prisma.tamanho.count();
  const totalRegistros = await prisma.estoquePeriodo.count();

  console.log("\n📊 Resumo do seed:");
  console.log(`  Produtos:  ${totalProdutos}`);
  console.log(`  Cores:     ${totalCores}`);
  console.log(`  Tamanhos:  ${totalTamanhos}`);
  console.log(`  Registros: ${totalRegistros}`);
  console.log("\n✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("\n❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
