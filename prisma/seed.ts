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

  // ── Solicitações de demonstração — classes 2, 3, 4 com status variados ────

  const classe3 = await prisma.classe.findUniqueOrThrow({ where: { numero: 3 } })
  const classe4 = await prisma.classe.findUniqueOrThrow({ where: { numero: 4 } })

  const equipFib1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'FIB-ABC-001' } })
  const equipFib2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'FIB-BOM-032' } })
  const equipFib3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'FIB-VAL-107' } })
  const equipFib4 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'FIB-SEN-044' } })
  const equipFib5 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'FIB-MOT-015' } })
  const equipCal1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CAL-VLV-001' } })

  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)

  const seedSolicitacoes = [
    // ── CLASSE 2 (1 solicitação) — EM_APROVACAO
    {
      id: 'seed-sol-c2-01',
      protocolo: 'SGI-20260410-2001',
      status: 'EM_APROVACAO',
      areaId: areaFibras.id,
      equipamentoId: equipFib1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Proteção contra sobrepressão',
      motivoDesabilitacao: 'Manutenção preventiva do sensor de pressão',
      medidasContingenciais: 'Monitoramento manual a cada 2h, operador de plantão na área',
      periodoInicio: daysAgo(2),
      periodoFim: daysAgo(-3),
      dataEnvio: daysAgo(2),
      createdAt: daysAgo(3),
    },

    // ── CLASSE 3 (3 solicitações) — DESABILITADO, ENCERRADA, EM_VALIDACAO_DA_REABILITACAO
    {
      id: 'seed-sol-c3-01',
      protocolo: 'SGI-20260405-3001',
      status: 'DESABILITADO',
      areaId: areaFibras.id,
      equipamentoId: equipFib2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção térmica do motor',
      motivoDesabilitacao: 'Substituição de relé térmico queimado',
      medidasContingenciais: 'Redução de carga do motor para 70%, inspeção a cada 1h',
      periodoInicio: daysAgo(10),
      periodoFim: daysAgo(7),
      dataEnvio: daysAgo(11),
      dataAprovacaoFinal: daysAgo(10),
      dataDesabilitacao: daysAgo(9),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(12),
    },
    {
      id: 'seed-sol-c3-02',
      protocolo: 'SGI-20260401-3002',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal1.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de alta temperatura da caldeira',
      motivoDesabilitacao: 'Calibração do transmissor de temperatura',
      medidasContingenciais: 'Monitoramento contínuo via termopar portátil',
      periodoInicio: daysAgo(20),
      periodoFim: daysAgo(17),
      dataEnvio: daysAgo(21),
      dataAprovacaoFinal: daysAgo(20),
      dataDesabilitacao: daysAgo(19),
      dataReabilitacao: daysAgo(17),
      dataEncerramento: daysAgo(16),
      createdAt: daysAgo(22),
    },
    {
      id: 'seed-sol-c3-03',
      protocolo: 'SGI-20260408-3003',
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      areaId: areaFibras.id,
      equipamentoId: equipFib3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Bloqueio de válvula de emergência',
      motivoDesabilitacao: 'Troca de atuador pneumático da válvula',
      medidasContingenciais: 'Válvula manual operada, operador dedicado',
      periodoInicio: daysAgo(7),
      periodoFim: daysAgo(4),
      dataEnvio: daysAgo(8),
      dataAprovacaoFinal: daysAgo(7),
      dataDesabilitacao: daysAgo(6),
      dataReabilitacao: daysAgo(4),
      createdAt: daysAgo(9),
    },

    // ── CLASSE 4 (2 solicitações) — EXECUCAO_AUTORIZADA, REJEITADA
    {
      id: 'seed-sol-c4-01',
      protocolo: 'SGI-20260412-4001',
      status: 'EXECUCAO_AUTORIZADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib4.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Shutdown de emergência do digestor',
      motivoDesabilitacao: 'Falha intermitente no módulo de entrada do CLP',
      medidasContingenciais: 'Operação em modo manual, supervisor presente, redução de carga',
      periodoInicio: daysAgo(1),
      periodoFim: now,
      dataEnvio: daysAgo(2),
      dataAprovacaoFinal: daysAgo(1),
      createdAt: daysAgo(3),
    },
    {
      id: 'seed-sol-c4-02',
      protocolo: 'SGI-20260409-4002',
      status: 'REJEITADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib5.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção contra sobrevelocidade do motor',
      motivoDesabilitacao: 'Teste de performance do motor sem proteção',
      medidasContingenciais: 'Operação com carga reduzida',
      periodoInicio: daysAgo(5),
      periodoFim: daysAgo(4),
      dataEnvio: daysAgo(6),
      createdAt: daysAgo(7),
    },
  ]

  for (const sol of seedSolicitacoes) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Criar aprovações para cada solicitação seed
  const seedAprovacoes = [
    // C2-01 (EM_APROVACAO): Ana pendente nível 1, Roberto aguardando nível 2
    { solicitacaoId: 'seed-sol-c2-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'PENDENTE' },
    { solicitacaoId: 'seed-sol-c2-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },

    // C3-01 (DESABILITADO): Ambos aprovaram
    { solicitacaoId: 'seed-sol-c3-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(10) },
    { solicitacaoId: 'seed-sol-c3-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(10) },

    // C3-02 (ENCERRADA): Ambos aprovaram
    { solicitacaoId: 'seed-sol-c3-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(20) },
    { solicitacaoId: 'seed-sol-c3-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(20) },

    // C3-03 (EM_VALIDACAO_DA_REABILITACAO): Ambos aprovaram desabilitação, aguardando validação
    { solicitacaoId: 'seed-sol-c3-03', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(7) },
    { solicitacaoId: 'seed-sol-c3-03', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(7) },

    // C4-01 (EXECUCAO_AUTORIZADA): Todos aprovaram (Ana, Roberto, Maria)
    { solicitacaoId: 'seed-sol-c4-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(2) },
    { solicitacaoId: 'seed-sol-c4-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(1) },
    { solicitacaoId: 'seed-sol-c4-01', aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(1) },

    // C4-02 (REJEITADA): Ana rejeitou no nível 1
    { solicitacaoId: 'seed-sol-c4-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'REJEITADO', respondidaEm: daysAgo(5), motivoRejeicao: 'Motivo insuficiente para desabilitar proteção de sobrevelocidade. Risco operacional inaceitável sem justificativa técnica detalhada.' },
    { solicitacaoId: 'seed-sol-c4-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },
    { solicitacaoId: 'seed-sol-c4-02', aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },
  ]

  for (const aprov of seedAprovacoes) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  // Eventos de auditoria para as solicitações seed
  const seedEventos = [
    { solicitacaoId: 'seed-sol-c2-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(2) },
    { solicitacaoId: 'seed-sol-c3-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(11) },
    { solicitacaoId: 'seed-sol-c3-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(10) },
    { solicitacaoId: 'seed-sol-c3-01', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(9) },
    { solicitacaoId: 'seed-sol-c3-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(21) },
    { solicitacaoId: 'seed-sol-c3-02', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(20) },
    { solicitacaoId: 'seed-sol-c3-02', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(19) },
    { solicitacaoId: 'seed-sol-c3-02', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(17) },
    { solicitacaoId: 'seed-sol-c3-02', userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: daysAgo(16) },
    { solicitacaoId: 'seed-sol-c3-03', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(8) },
    { solicitacaoId: 'seed-sol-c3-03', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(7) },
    { solicitacaoId: 'seed-sol-c3-03', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(6) },
    { solicitacaoId: 'seed-sol-c3-03', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-c4-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(2) },
    { solicitacaoId: 'seed-sol-c4-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(2) },
    { solicitacaoId: 'seed-sol-c4-01', userId: aprovador2.id, acao: 'APROVADO', createdAt: daysAgo(1) },
    { solicitacaoId: 'seed-sol-c4-01', userId: gestor.id, acao: 'APROVADO', createdAt: daysAgo(1) },
    { solicitacaoId: 'seed-sol-c4-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(6) },
    { solicitacaoId: 'seed-sol-c4-02', userId: aprovador1.id, acao: 'REJEITADO', detalhes: 'Motivo insuficiente', createdAt: daysAgo(5) },
  ]

  for (const evt of seedEventos) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 6 solicitações de demonstração criadas (C2×1, C3×3, C4×2)')

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
