import { PrismaClient, Especie } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Vacinas padrão para cachorro
  const vacinasCachorro = [
    {
      nome: 'V8 (Óctupla)',
      descricao: 'Protege contra cinomose, parvovirose, coronavirose, hepatite infecciosa, adenovirose, parainfluenza e leptospirose',
      especies: [Especie.CACHORRO],
    },
    {
      nome: 'V10 (Déctupla)',
      descricao: 'Protege contra as mesmas doenças da V8 + 2 tipos adicionais de leptospirose',
      especies: [Especie.CACHORRO],
    },
    {
      nome: 'Antirrábica',
      descricao: 'Protege contra a raiva',
      especies: [Especie.CACHORRO, Especie.GATO], // Antirrábica serve para ambos
    },
    {
      nome: 'Giardiose',
      descricao: 'Protege contra a giardíase',
      especies: [Especie.CACHORRO],
    },
    {
      nome: 'Leishmaniose',
      descricao: 'Protege contra a leishmaniose visceral',
      especies: [Especie.CACHORRO],
    },
    {
      nome: 'Gripe Canina (Tosse dos Canis)',
      descricao: 'Protege contra a traqueobronquite infecciosa canina',
      especies: [Especie.CACHORRO],
    },
  ];

  // Vacinas padrão para gato
  const vacinasGato = [
    {
      nome: 'V3 (Tríplice Felina)',
      descricao: 'Protege contra panleucopenia, rinotraqueíte e calicivirose',
      especies: [Especie.GATO],
    },
    {
      nome: 'V4 (Quádrupla Felina)',
      descricao: 'Protege contra as mesmas doenças da V3 + clamidiose',
      especies: [Especie.GATO],
    },
    {
      nome: 'V5 (Quíntupla Felina)',
      descricao: 'Protege contra as mesmas doenças da V4 + leucemia felina (FeLV)',
      especies: [Especie.GATO],
    },
    {
      nome: 'Antirrábica Felina',
      descricao: 'Protege contra a raiva',
      especies: [Especie.GATO],
    },
    {
      nome: 'Leucemia Felina (FeLV)',
      descricao: 'Protege contra o vírus da leucemia felina',
      especies: [Especie.GATO],
    },
  ];

  // Combinar todas as vacinas
  const todasVacinas = [...vacinasCachorro, ...vacinasGato];

  console.log(`📋 Criando ${todasVacinas.length} vacinas padrão...`);

  for (const vacina of todasVacinas) {
    await prisma.vacinas.upsert({
      where: { nome: vacina.nome },
      update: {},
      create: vacina,
    });
    console.log(`✅ Vacina criada/atualizada: ${vacina.nome}`);
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
