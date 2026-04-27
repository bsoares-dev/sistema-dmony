import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function exportar() {
  console.log("📦 Sugando dados do banco local...");

  const cores = await prisma.cor.findMany();
  const tamanhos = await prisma.tamanho.findMany();
  const produtos = await prisma.produto.findMany();

  const data = { cores, tamanhos, produtos };

  // Salva tudo num arquivo JSON
  fs.writeFileSync("catalogo_dmony.json", JSON.stringify(data, null, 2));

  console.log(`✅ Sucesso! Exportamos:`);
  console.log(`- ${cores.length} Cores`);
  console.log(`- ${tamanhos.length} Tamanhos`);
  console.log(`- ${produtos.length} Produtos`);
  console.log("Tudo salvo no arquivo 'catalogo_dmony.json'.");
}

async function importar() {
  console.log("☁️ Injetando dados na Nuvem...");

  if (!fs.existsSync("catalogo_dmony.json")) {
    console.error(
      "❌ Arquivo 'catalogo_dmony.json' não encontrado! Rode o exportar primeiro.",
    );
    return;
  }

  const data = JSON.parse(fs.readFileSync("catalogo_dmony.json", "utf-8"));

  // Injetando no novo banco (o skipDuplicates protege caso você rode duas vezes)
  await prisma.cor.createMany({ data: data.cores, skipDuplicates: true });
  await prisma.tamanho.createMany({
    data: data.tamanhos,
    skipDuplicates: true,
  });
  await prisma.produto.createMany({
    data: data.produtos,
    skipDuplicates: true,
  });

  console.log("🚀 BOOM! Catálogo transferido com sucesso para a Nuvem!");
}

const acao = process.argv[2];

if (acao === "exportar") {
  exportar().finally(() => prisma.$disconnect());
} else if (acao === "importar") {
  importar().finally(() => prisma.$disconnect());
} else {
  console.log(
    "Use o comando correto: npx tsx migrador.ts exportar OU npx tsx migrador.ts importar",
  );
}
