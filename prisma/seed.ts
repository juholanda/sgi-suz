import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding SGI database...')

  // Classes
  const classes = [
    { numero: 1, descricao: 'Baixo risco', prazoMaximoDias: 7, cor: '#16A34A' },
    { numero: 2, descricao: 'Risco moderado', prazoMaximoDias: 5, cor: '#EAB308' },
    { numero: 3, descricao: 'Alto risco', prazoMaximoDias: 3, cor: '#EA580C' },
    { numero: 4, descricao: 'Risco crítico', prazoMaximoDias: 1, cor: '#DC2626' },
    { numero: 5, descricao: 'NÃO FORÇÁVEL', prazoMaximoDias: null, cor: '#7F1D1D' },
  ]
  for (const c of classes) {
    await prisma.classe.upsert({
      where: { numero: c.numero },
      update: c,
      create: c,
    })
  }

  // Planta
  const planta = await prisma.planta.upsert({
    where: { id: 'planta-aracruz' },
    update: {},
    create: { id: 'planta-aracruz', nome: 'Unidade Aracruz', codigo: 'ARA' },
  })

  // Área
  const area = await prisma.area.upsert({
    where: { id: 'area-fibras' },
    update: {},
    create: { id: 'area-fibras', nome: 'Área de Fibras', codigo: 'FIB', plantaId: planta.id },
  })

  // Equipamentos demo
  const tags = ['FIB-ABC-001', 'FIB-BOM-032', 'FIB-VAL-107', 'FIB-SEN-044']
  for (const tag of tags) {
    await prisma.equipamento.upsert({
      where: { tag },
      update: {},
      create: { tag, descricao: `Intertravamento ${tag}`, areaId: area.id },
    })
  }

  // Admin user
  const hash = await bcrypt.hash('suzano123', 10)
  const admin = await prisma.user.upsert({
    where: { matricula: '000001' },
    update: {},
    create: {
      matricula: '000001',
      nome: 'Administrador SGI',
      email: 'admin@suzano.com.br',
      passwordHash: hash,
    },
  })

  await prisma.usuarioPerfil.create({
    data: { userId: admin.id, perfil: 'ADMINISTRADOR', plantaId: planta.id },
  }).catch(() => {/* already exists */})

  // Solicitante demo
  const solicitante = await prisma.user.upsert({
    where: { matricula: '000002' },
    update: {},
    create: {
      matricula: '000002',
      nome: 'João Silva',
      email: 'joao.silva@suzano.com.br',
      passwordHash: await bcrypt.hash('suzano123', 10),
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: planta.id, areaId: area.id },
  }).catch(() => {/* already exists */})

  // Executante demo
  const executante = await prisma.user.upsert({
    where: { matricula: '000003' },
    update: {},
    create: {
      matricula: '000003',
      nome: 'Maria Executante',
      email: 'maria.executante@suzano.com.br',
      passwordHash: await bcrypt.hash('suzano123', 10),
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: executante.id, perfil: 'EXECUTANTE', plantaId: planta.id, areaId: area.id },
  }).catch(() => {/* already exists */})

  // Aprovador demo (nível 1)
  const aprovador = await prisma.user.upsert({
    where: { matricula: '000004' },
    update: {},
    create: {
      matricula: '000004',
      nome: 'Carlos Aprovador',
      email: 'carlos.aprovador@suzano.com.br',
      passwordHash: await bcrypt.hash('suzano123', 10),
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: aprovador.id, perfil: 'APROVADOR', plantaId: planta.id, areaId: area.id },
  }).catch(() => {/* already exists */})

  // Admin também como aprovador (nível final)
  await prisma.usuarioPerfil.create({
    data: { userId: admin.id, perfil: 'APROVADOR', plantaId: planta.id },
  }).catch(() => {/* already exists */})

  // Alçadas de aprovação por classe (1..4), com 2 níveis para demonstrar o fluxo completo.
  const classesAtivas = await prisma.classe.findMany({
    where: { numero: { in: [1, 2, 3, 4] } },
    select: { id: true, numero: true },
  })
  for (const classe of classesAtivas) {
    await prisma.alcadaAprovacao.upsert({
      where: {
        plantaId_classeId_nivel_userId: {
          plantaId: planta.id,
          classeId: classe.id,
          nivel: 1,
          userId: aprovador.id,
        },
      },
      update: {},
      create: {
        plantaId: planta.id,
        classeId: classe.id,
        nivel: 1,
        userId: aprovador.id,
      },
    })

    await prisma.alcadaAprovacao.upsert({
      where: {
        plantaId_classeId_nivel_userId: {
          plantaId: planta.id,
          classeId: classe.id,
          nivel: 2,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        plantaId: planta.id,
        classeId: classe.id,
        nivel: 2,
        userId: admin.id,
      },
    })
  }

  console.log('Seed completo! Credenciais: 000001 (admin/final aprovador), 000002 (solicitante), 000003 (executante), 000004 (aprovador) / senha suzano123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
