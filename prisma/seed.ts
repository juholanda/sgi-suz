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

  // ── Equipamentos Limeira ───────────────────────────────────────────────────
  const equipsLimeira = ['PRD-BOM-001', 'PRD-VAL-002', 'PRD-SEN-010', 'PRD-MOT-003']
  for (const tag of equipsLimeira) {
    await prisma.equipamento.upsert({
      where: { tag },
      update: {},
      create: { tag, descricao: `Intertravamento ${tag}`, areaId: areaLimeira.id },
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
  // Demo: João também tem perfil APROVADOR e EXECUTANTE para testar o switcher
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'APROVADOR', plantaId: planta.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: planta.id, areaId: areaFibras.id },
  }).catch(() => {})
  // Demo: João também acessa Limeira (segunda planta) como Solicitante e Executante
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: plantaLimeira.id, areaId: areaLimeira.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: plantaLimeira.id, areaId: areaLimeira.id },
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

  // ── Alçadas de aprovação — todas as classes, todas as plantas ─────────────
  const todasClasses = await prisma.classe.findMany({ where: { ativa: true, numero: { lte: 4 } } })
  const todasPlantas = [planta, plantaLimeira]

  for (const plantaItem of todasPlantas) {
    for (const classeItem of todasClasses) {
      // Nível 1: Ana Costa (aprovador1) — para todas as classes e plantas
      await prisma.alcadaAprovacao.upsert({
        where: { plantaId_classeId_nivel_userId: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 1, userId: aprovador1.id } },
        update: {},
        create: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 1, userId: aprovador1.id },
      })
      // Nível 2: Roberto Alves (aprovador2) — para classes 2, 3, 4 (mais exigentes)
      if (classeItem.numero >= 2) {
        await prisma.alcadaAprovacao.upsert({
          where: { plantaId_classeId_nivel_userId: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 2, userId: aprovador2.id } },
          update: {},
          create: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 2, userId: aprovador2.id },
        })
      }
      // Nível 3 para classe 4: gestor SMS como aprovador final
      if (classeItem.numero >= 4) {
        await prisma.alcadaAprovacao.upsert({
          where: { plantaId_classeId_nivel_userId: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 3, userId: gestor.id } },
          update: {},
          create: { plantaId: plantaItem.id, classeId: classeItem.id, nivel: 3, userId: gestor.id },
        })
        // Perfil APROVADOR para gestor também (para que possa aprovar)
        await prisma.usuarioPerfil.create({
          data: { userId: gestor.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
        }).catch(() => {})
      }
    }
    // Garantir que aprovador1 e aprovador2 têm perfil APROVADOR na planta Limeira também
    await prisma.usuarioPerfil.create({
      data: { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
    }).catch(() => {})
    await prisma.usuarioPerfil.create({
      data: { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
    }).catch(() => {})
  }

  // ── Medidas contingenciais — 16 medidas gerais, 4 obrigatórias ───────────
  const medidasContingenciaisData = [
    // Obrigatórias (primeiras 4 - sempre aparecem e não podem ser desmarcadas)
    { descricao: 'Monitoramento manual periódico da área afetada', obrigatoria: true, ordem: 1 },
    { descricao: 'Isolamento da área de risco com fita de sinalização ou barreira física', obrigatoria: true, ordem: 2 },
    { descricao: 'Comunicação formal ao supervisor responsável e equipe de operação', obrigatoria: true, ordem: 3 },
    { descricao: 'Instalação de cartão de advertência no equipamento/painel de controle', obrigatoria: true, ordem: 4 },

    // Opcionais
    { descricao: 'Proteção alternativa temporária em substituição ao dispositivo desabilitado', obrigatoria: false, ordem: 5 },
    { descricao: 'Inspeção visual do equipamento a cada 2 horas', obrigatoria: false, ordem: 6 },
    { descricao: 'Redução da taxa de produção ou carga de processo', obrigatoria: false, ordem: 7 },
    { descricao: 'Posicionamento de operador de plantão na área de risco', obrigatoria: false, ordem: 8 },
    { descricao: 'Verificação contínua dos parâmetros operacionais críticos', obrigatoria: false, ordem: 9 },
    { descricao: 'Notificação da equipe de manutenção em standby', obrigatoria: false, ordem: 10 },
    { descricao: 'Uso de sistema de detecção alternativo (sensor portátil, detector manual)', obrigatoria: false, ordem: 11 },
    { descricao: 'Restrição de acesso à área para pessoal não autorizado', obrigatoria: false, ordem: 12 },
    { descricao: 'Verificação de integridade do equipamento antes de cada turno', obrigatoria: false, ordem: 13 },
    { descricao: 'Registro horário das condições operacionais no livro de bordo', obrigatoria: false, ordem: 14 },
    { descricao: 'Disponibilização de EPI adicional para operadores da área', obrigatoria: false, ordem: 15 },
    { descricao: 'Acionamento do procedimento de emergência caso haja desvio de processo', obrigatoria: false, ordem: 16 },
  ]

  // Only create if not already seeded
  const existingMedidas = await prisma.medidaContingencial.count()
  if (existingMedidas === 0) {
    for (const medida of medidasContingenciaisData) {
      await prisma.medidaContingencial.create({ data: medida })
    }
    console.log('✓ 16 medidas contingenciais criadas')
  }

  console.log(`
✅ Seed completo!

Credenciais de acesso (senha: suzano123):
  000001 — Administrador SGI
  000002 — João Silva (Solicitante — Fibras/Aracruz)
  000003 — Carlos Mendes (Executante — Fibras/Aracruz)
  000004 — Ana Costa (Aprovador nível 1 — todas as classes/plantas)
  000005 — Roberto Alves (Aprovador nível 2 — classes 2-4/todas as plantas)
  000006 — Maria Santos (Gestor SMS + Aprovador nível 3 — classe 4)
`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
