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

  console.log('Seed completo! Credenciais: matrícula 000001 / senha suzano123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
