import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding SGI database...')

  const hash = (p: string) => bcrypt.hash(p, 10)

  // ── Cargos (bootstrap MER) ─────────────────────────────────────────────────
  const cargosData = [
    { id: 'cargo-1', nome: 'Especialista de Operação' },
    { id: 'cargo-2', nome: 'Especialista de Manutenção' },
    { id: 'cargo-3', nome: 'Coordenador de Área' },
    { id: 'cargo-4', nome: 'Coordenador de Manutenção' },
    { id: 'cargo-5', nome: 'Gerente de Área' },
    { id: 'cargo-6', nome: 'Gerente de Manutenção' },
    { id: 'cargo-7', nome: 'Gerente Industrial' },
  ]
  for (const c of cargosData) {
    await prisma.cargo.upsert({ where: { id: c.id }, update: {}, create: c })
  }

  // ── Classes (bootstrap MER) ────────────────────────────────────────────────
  const classes = [
    { numero: 1, descricao: 'Baixo risco',    prazoMaximoDias: 7, cor: '#16A34A' },
    { numero: 2, descricao: 'Risco moderado', prazoMaximoDias: 5, cor: '#EAB308' },
    { numero: 3, descricao: 'Alto risco',     prazoMaximoDias: 3, cor: '#EA580C' },
    { numero: 4, descricao: 'Risco crítico',  prazoMaximoDias: 1, cor: '#DC2626' },
    { numero: 5, descricao: 'NÃO FORÇÁVEL',   prazoMaximoDias: null, cor: '#7F1D1D' },
  ]
  for (const c of classes) {
    await prisma.classe.upsert({ where: { numero: c.numero }, update: c, create: c })
  }

  const classe1 = await prisma.classe.findUniqueOrThrow({ where: { numero: 1 } })
  const classe2 = await prisma.classe.findUniqueOrThrow({ where: { numero: 2 } })

  // ── Plantas ────────────────────────────────────────────────────────────────
  const planta = await prisma.planta.upsert({
    where: { id: 'planta-aracruz' },
    update: {},
    create: { id: 'planta-aracruz', nome: 'Unidade Aracruz', codigo: 'ARA' },
  })

  const plantaLimeira = await prisma.planta.upsert({
    where: { id: 'planta-limeira' },
    update: {},
    create: { id: 'planta-limeira', nome: 'Unidade Limeira', codigo: 'LIM' },
  })

  // ── Áreas ──────────────────────────────────────────────────────────────────
  const areaFibras = await prisma.area.upsert({
    where: { id: 'area-fibras' },
    update: {},
    create: { id: 'area-fibras', nome: 'Área de Fibras', codigo: 'FIB', plantaId: planta.id },
  })

  const areaCaldeira = await prisma.area.upsert({
    where: { id: 'area-caldeira' },
    update: {},
    create: { id: 'area-caldeira', nome: 'Caldeira e Utilidades', codigo: 'CAL', plantaId: planta.id },
  })

  const areaLimeira = await prisma.area.upsert({
    where: { id: 'area-lim-producao' },
    update: {},
    create: { id: 'area-lim-producao', nome: 'Produção', codigo: 'PRD', plantaId: plantaLimeira.id },
  })

  // ── Equipamentos ───────────────────────────────────────────────────────────
  const equipsFibras = ['FIB-ABC-001', 'FIB-BOM-032', 'FIB-VAL-107', 'FIB-SEN-044', 'FIB-MOT-015']
  for (const tag of equipsFibras) {
    await prisma.equipamento.upsert({
      where: { tag },
      update: {},
      create: { tag, descricao: `Intertravamento ${tag}`, areaId: areaFibras.id },
    })
  }

  const equipsCaldeira = ['CAL-VLV-001', 'CAL-SEN-022', 'CAL-PMP-003']
  for (const tag of equipsCaldeira) {
    await prisma.equipamento.upsert({
      where: { tag },
      update: {},
      create: { tag, descricao: `Intertravamento ${tag}`, areaId: areaCaldeira.id },
    })
  }

  // ── Usuários ───────────────────────────────────────────────────────────────
  // Admin
  const admin = await prisma.user.upsert({
    where: { matricula: '000001' },
    update: {},
    create: {
      matricula: '000001',
      nome: 'Administrador SGI',
      email: 'admin@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-7',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: admin.id, perfil: 'ADMINISTRADOR', plantaId: planta.id },
  }).catch(() => {})

  // Solicitante
  const solicitante = await prisma.user.upsert({
    where: { matricula: '000002' },
    update: {},
    create: {
      matricula: '000002',
      nome: 'João Silva',
      email: 'joao.silva@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-1',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: planta.id, areaId: areaFibras.id },
  }).catch(() => {})

  // Executante
  const executante = await prisma.user.upsert({
    where: { matricula: '000003' },
    update: {},
    create: {
      matricula: '000003',
      nome: 'Carlos Mendes',
      email: 'carlos.mendes@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-2',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: executante.id, perfil: 'EXECUTANTE', plantaId: planta.id, areaId: areaFibras.id },
  }).catch(() => {})

  // Aprovador nível 1 — Coordenador de Área
  const aprovador1 = await prisma.user.upsert({
    where: { matricula: '000004' },
    update: {},
    create: {
      matricula: '000004',
      nome: 'Ana Costa',
      email: 'ana.costa@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-3',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: planta.id, areaId: areaFibras.id },
  }).catch(() => {})

  // Aprovador nível 2 — Gerente de Área
  const aprovador2 = await prisma.user.upsert({
    where: { matricula: '000005' },
    update: {},
    create: {
      matricula: '000005',
      nome: 'Roberto Alves',
      email: 'roberto.alves@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-5',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: planta.id, areaId: areaFibras.id },
  }).catch(() => {})

  // Gestor SMS
  const gestor = await prisma.user.upsert({
    where: { matricula: '000006' },
    update: {},
    create: {
      matricula: '000006',
      nome: 'Maria Santos',
      email: 'maria.santos@suzano.com.br',
      passwordHash: await hash('suzano123'),
      cargoId: 'cargo-6',
    },
  })
  await prisma.usuarioPerfil.create({
    data: { userId: gestor.id, perfil: 'GESTOR_SMS', plantaId: planta.id },
  }).catch(() => {})

  // ── Alçadas de aprovação ───────────────────────────────────────────────────
  // Classe 1: 1 aprovador (nível 1 = Ana Costa)
  await prisma.alcadaAprovacao.upsert({
    where: { plantaId_classeId_nivel_userId: { plantaId: planta.id, classeId: classe1.id, nivel: 1, userId: aprovador1.id } },
    update: {},
    create: { plantaId: planta.id, classeId: classe1.id, nivel: 1, userId: aprovador1.id },
  })

  // Classe 2: 2 aprovadores sequenciais
  await prisma.alcadaAprovacao.upsert({
    where: { plantaId_classeId_nivel_userId: { plantaId: planta.id, classeId: classe2.id, nivel: 1, userId: aprovador1.id } },
    update: {},
    create: { plantaId: planta.id, classeId: classe2.id, nivel: 1, userId: aprovador1.id },
  })
  await prisma.alcadaAprovacao.upsert({
    where: { plantaId_classeId_nivel_userId: { plantaId: planta.id, classeId: classe2.id, nivel: 2, userId: aprovador2.id } },
    update: {},
    create: { plantaId: planta.id, classeId: classe2.id, nivel: 2, userId: aprovador2.id },
  })

  console.log(`
✅ Seed completo!

Credenciais de acesso (senha: suzano123):
  000001 — Administrador SGI
  000002 — João Silva (Solicitante — Fibras/Aracruz)
  000003 — Carlos Mendes (Executante — Fibras/Aracruz)
  000004 — Ana Costa (Aprovador nível 1 — Fibras/Aracruz)
  000005 — Roberto Alves (Aprovador nível 2 — Fibras/Aracruz)
  000006 — Maria Santos (Gestor SMS — Aracruz)
`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
