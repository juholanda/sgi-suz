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

  // ── Planta Ribas do Rio Pardo ─────────────────────────────────────────────
  const plantaRibas = await prisma.planta.upsert({
    where: { id: 'planta-ribas' },
    update: {},
    create: { id: 'planta-ribas', nome: 'Unidade Ribas do Rio Pardo', codigo: 'RRP' },
  })

  // Áreas Ribas
  const areaRecuperacao = await prisma.area.upsert({
    where: { id: 'area-rrp-recuperacao' },
    update: {},
    create: { id: 'area-rrp-recuperacao', nome: 'Recuperação e Utilidades', codigo: 'REC', plantaId: plantaRibas.id },
  })

  const areaCelulose = await prisma.area.upsert({
    where: { id: 'area-rrp-celulose' },
    update: {},
    create: { id: 'area-rrp-celulose', nome: 'Linha de Celulose', codigo: 'CEL', plantaId: plantaRibas.id },
  })

  // Equipamentos Ribas
  const equipsRibas = [
    { tag: 'REC-VLV-001', descricao: 'Válvula de bloqueio caldeira de recuperação', areaId: areaRecuperacao.id },
    { tag: 'REC-SEN-012', descricao: 'Sensor de nível tanque de licor', areaId: areaRecuperacao.id },
    { tag: 'REC-PMP-005', descricao: 'Bomba de licor verde', areaId: areaRecuperacao.id },
    { tag: 'CEL-MOT-008', descricao: 'Motor principal do lavador', areaId: areaCelulose.id },
    { tag: 'CEL-SEN-021', descricao: 'Sensor de consistência da polpa', areaId: areaCelulose.id },
    { tag: 'CEL-VLV-015', descricao: 'Válvula de segurança do digestor', areaId: areaCelulose.id },
  ]
  for (const eq of equipsRibas) {
    await prisma.equipamento.upsert({ where: { tag: eq.tag }, update: {}, create: eq })
  }

  const eqRec1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-VLV-001' } })
  const eqRec2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-SEN-012' } })
  const eqRec3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-PMP-005' } })
  const eqCel1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-MOT-008' } })
  const eqCel2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-SEN-021' } })
  const eqCel3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-VLV-015' } })

  // Perfis para Ribas (reaproveitar os mesmos usuários)
  await prisma.usuarioPerfil.create({
    data: { userId: admin.id, perfil: 'ADMINISTRADOR', plantaId: plantaRibas.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: plantaRibas.id, areaId: areaRecuperacao.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: plantaRibas.id, areaId: areaRecuperacao.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: executante.id, perfil: 'EXECUTANTE', plantaId: plantaRibas.id, areaId: areaCelulose.id },
  }).catch(() => {})

  // Alçadas para Ribas
  for (const classeItem of todasClasses) {
    await prisma.alcadaAprovacao.upsert({
      where: { plantaId_classeId_nivel_userId: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 1, userId: aprovador1.id } },
      update: {},
      create: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 1, userId: aprovador1.id },
    })
    if (classeItem.numero >= 2) {
      await prisma.alcadaAprovacao.upsert({
        where: { plantaId_classeId_nivel_userId: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 2, userId: aprovador2.id } },
        update: {},
        create: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 2, userId: aprovador2.id },
      })
    }
    if (classeItem.numero >= 4) {
      await prisma.alcadaAprovacao.upsert({
        where: { plantaId_classeId_nivel_userId: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 3, userId: gestor.id } },
        update: {},
        create: { plantaId: plantaRibas.id, classeId: classeItem.id, nivel: 3, userId: gestor.id },
      })
    }
  }
  await prisma.usuarioPerfil.create({
    data: { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: gestor.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  }).catch(() => {})
  await prisma.usuarioPerfil.create({
    data: { userId: gestor.id, perfil: 'GESTOR_SMS', plantaId: plantaRibas.id },
  }).catch(() => {})

  // ── Solicitações Ribas — C2×1, C3×3, C4×2 com status variados ────
  const seedSolicitacoesRibas = [
    // CLASSE 2 (1) — DESABILITADO
    {
      id: 'seed-sol-rrp-c2-01',
      protocolo: 'SGI-20260412-R2001',
      status: 'DESABILITADO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Bloqueio de alimentação caldeira de recuperação',
      motivoDesabilitacao: 'Substituição de válvula de bloqueio com vazamento interno',
      medidasContingenciais: 'Monitoramento manual, operador dedicado na caldeira',
      periodoInicio: daysAgo(5),
      periodoFim: daysAgo(0),
      dataEnvio: daysAgo(6),
      dataAprovacaoFinal: daysAgo(5),
      dataDesabilitacao: daysAgo(4),
      createdAt: daysAgo(7),
    },

    // CLASSE 3 (3) — EM_APROVACAO, EM_EXECUCAO (via EXECUCAO_AUTORIZADA), ENCERRADA
    {
      id: 'seed-sol-rrp-c3-01',
      protocolo: 'SGI-20260414-R3001',
      status: 'EM_APROVACAO',
      areaId: areaCelulose.id,
      equipamentoId: eqCel1.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção do motor principal do lavador',
      motivoDesabilitacao: 'Troca de rolamentos com desgaste excessivo',
      medidasContingenciais: 'Redução de velocidade, monitoramento de vibração a cada 30min',
      periodoInicio: daysAgo(1),
      periodoFim: daysAgo(-2),
      dataEnvio: daysAgo(1),
      createdAt: daysAgo(2),
    },
    {
      id: 'seed-sol-rrp-c3-02',
      protocolo: 'SGI-20260410-R3002',
      status: 'EXECUCAO_AUTORIZADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de nível alto do tanque de licor',
      motivoDesabilitacao: 'Calibração do transmissor de nível',
      medidasContingenciais: 'Medição manual com régua a cada 1h, alarme visual ativado',
      periodoInicio: daysAgo(3),
      periodoFim: daysAgo(0),
      dataEnvio: daysAgo(4),
      dataAprovacaoFinal: daysAgo(3),
      createdAt: daysAgo(5),
    },
    {
      id: 'seed-sol-rrp-c3-03',
      protocolo: 'SGI-20260401-R3003',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Controle de consistência da polpa',
      motivoDesabilitacao: 'Substituição de sensor de consistência danificado',
      medidasContingenciais: 'Coleta manual de amostra a cada 2h, ajuste manual de diluição',
      periodoInicio: daysAgo(18),
      periodoFim: daysAgo(15),
      dataEnvio: daysAgo(19),
      dataAprovacaoFinal: daysAgo(18),
      dataDesabilitacao: daysAgo(17),
      dataReabilitacao: daysAgo(15),
      dataEncerramento: daysAgo(14),
      createdAt: daysAgo(20),
    },

    // CLASSE 4 (2) — EM_VALIDACAO_DA_REABILITACAO, REJEITADA
    {
      id: 'seed-sol-rrp-c4-01',
      protocolo: 'SGI-20260407-R4001',
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec3.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Intertravamento de proteção da bomba de licor verde',
      motivoDesabilitacao: 'Falha no inversor de frequência, necessidade de bypass',
      medidasContingenciais: 'Operação manual, monitoramento de corrente, supervisão contínua',
      periodoInicio: daysAgo(8),
      periodoFim: daysAgo(7),
      dataEnvio: daysAgo(9),
      dataAprovacaoFinal: daysAgo(8),
      dataDesabilitacao: daysAgo(7),
      dataReabilitacao: daysAgo(5),
      createdAt: daysAgo(10),
    },
    {
      id: 'seed-sol-rrp-c4-02',
      protocolo: 'SGI-20260413-R4002',
      status: 'REJEITADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel3.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Válvula de segurança do digestor — alívio de pressão',
      motivoDesabilitacao: 'Teste de integridade sem proteção ativa',
      medidasContingenciais: 'Redução de pressão de operação',
      periodoInicio: daysAgo(2),
      periodoFim: daysAgo(1),
      dataEnvio: daysAgo(2),
      createdAt: daysAgo(3),
    },
  ]

  for (const sol of seedSolicitacoesRibas) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Aprovações Ribas
  const seedAprovacoesRibas = [
    // C2-01 (DESABILITADO): ambos aprovaram
    { solicitacaoId: 'seed-sol-rrp-c2-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(5) },
    { solicitacaoId: 'seed-sol-rrp-c2-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(5) },

    // C3-01 (EM_APROVACAO): Ana pendente nível 1, Roberto aguardando nível 2
    { solicitacaoId: 'seed-sol-rrp-c3-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'PENDENTE' },
    { solicitacaoId: 'seed-sol-rrp-c3-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },

    // C3-02 (EXECUCAO_AUTORIZADA): ambos aprovaram
    { solicitacaoId: 'seed-sol-rrp-c3-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-c3-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(3) },

    // C3-03 (ENCERRADA): ambos aprovaram
    { solicitacaoId: 'seed-sol-rrp-c3-03', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(18) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(18) },

    // C4-01 (EM_VALIDACAO_DA_REABILITACAO): todos aprovaram desabilitação
    { solicitacaoId: 'seed-sol-rrp-c4-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(9) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(8) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(8) },

    // C4-02 (REJEITADA): Ana rejeitou
    { solicitacaoId: 'seed-sol-rrp-c4-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'REJEITADO', respondidaEm: daysAgo(2), motivoRejeicao: 'Teste de integridade sem proteção ativa em válvula de segurança do digestor é inaceitável. Propor procedimento alternativo.' },
    { solicitacaoId: 'seed-sol-rrp-c4-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },
    { solicitacaoId: 'seed-sol-rrp-c4-02', aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },
  ]

  for (const aprov of seedAprovacoesRibas) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  // Eventos de auditoria Ribas
  const seedEventosRibas = [
    { solicitacaoId: 'seed-sol-rrp-c2-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(6) },
    { solicitacaoId: 'seed-sol-rrp-c2-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(5) },
    { solicitacaoId: 'seed-sol-rrp-c2-01', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-c3-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(1) },
    { solicitacaoId: 'seed-sol-rrp-c3-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-c3-02', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-c3-02', userId: aprovador2.id, acao: 'APROVADO', createdAt: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(19) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(18) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(17) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(15) },
    { solicitacaoId: 'seed-sol-rrp-c3-03', userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: daysAgo(14) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(9) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(9) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: aprovador2.id, acao: 'APROVADO', createdAt: daysAgo(8) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: gestor.id, acao: 'APROVADO', createdAt: daysAgo(8) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(7) },
    { solicitacaoId: 'seed-sol-rrp-c4-01', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(5) },
    { solicitacaoId: 'seed-sol-rrp-c4-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(2) },
    { solicitacaoId: 'seed-sol-rrp-c4-02', userId: aprovador1.id, acao: 'REJEITADO', detalhes: 'Procedimento inaceitável', createdAt: daysAgo(2) },
  ]

  for (const evt of seedEventosRibas) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 6 solicitações de demonstração criadas para Ribas do Rio Pardo (C2×1, C3×3, C4×2)')

  // ── Histórico de solicitações (meses anteriores) — Aracruz + Ribas ────────
  // Popula gráficos de tendência, compliance e ciclo de vida com dados reais

  const equipCal2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CAL-SEN-022' } })
  const equipCal3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CAL-PMP-003' } })

  const historicoSolicitacoes = [
    // ═══ ARACRUZ — Meses 1-6 atrás ═══════════════════════════════════════════

    // ── 5 meses atrás — C1, Fibras, dentro do prazo
    {
      id: 'seed-hist-ara-01',
      protocolo: 'SGI-20251115-H001',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Proteção contra sobretemperatura',
      motivoDesabilitacao: 'Calibração de termopar',
      medidasContingenciais: 'Monitoramento manual via pirômetro',
      periodoInicio: daysAgo(155),
      periodoFim: daysAgo(150),
      dataEnvio: daysAgo(156),
      dataAprovacaoFinal: daysAgo(155),
      dataDesabilitacao: daysAgo(154),
      dataReabilitacao: daysAgo(150),
      dataEncerramento: daysAgo(149),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(157),
    },
    // ── 5 meses atrás — C2, Caldeira, prazo estourado
    {
      id: 'seed-hist-ara-02',
      protocolo: 'SGI-20251118-H002',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal2.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Trip de nível alto tambor de vapor',
      motivoDesabilitacao: 'Substituição transmissor de nível com vazamento',
      medidasContingenciais: 'Inspeção visual a cada 30min, alarme manual',
      periodoInicio: daysAgo(150),
      periodoFim: daysAgo(145),
      dataEnvio: daysAgo(151),
      dataAprovacaoFinal: daysAgo(150),
      dataDesabilitacao: daysAgo(149),
      dataReabilitacao: daysAgo(140),
      dataEncerramento: daysAgo(139),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(152),
    },
    // ── 4 meses atrás — C3, Fibras, dentro do prazo
    {
      id: 'seed-hist-ara-03',
      protocolo: 'SGI-20251210-H003',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Bloqueio por alta vibração do motor',
      motivoDesabilitacao: 'Troca de rolamento dianteiro',
      medidasContingenciais: 'Redução de carga para 50%, monitoramento contínuo de vibração',
      periodoInicio: daysAgo(127),
      periodoFim: daysAgo(125),
      dataEnvio: daysAgo(128),
      dataAprovacaoFinal: daysAgo(127),
      dataDesabilitacao: daysAgo(126),
      dataReabilitacao: daysAgo(124),
      dataEncerramento: daysAgo(123),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(129),
    },
    // ── 4 meses atrás — C4, Caldeira, prazo estourado
    {
      id: 'seed-hist-ara-04',
      protocolo: 'SGI-20251215-H004',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal1.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Shutdown de emergência caldeira',
      motivoDesabilitacao: 'Falha no módulo de saída do CLP — troca emergencial',
      medidasContingenciais: 'Operação manual, supervisor dedicado, carga reduzida a 30%',
      periodoInicio: daysAgo(122),
      periodoFim: daysAgo(121),
      dataEnvio: daysAgo(123),
      dataAprovacaoFinal: daysAgo(122),
      dataDesabilitacao: daysAgo(121),
      dataReabilitacao: daysAgo(118),
      dataEncerramento: daysAgo(117),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(124),
    },
    // ── 3 meses atrás — C1, Fibras, dentro do prazo
    {
      id: 'seed-hist-ara-05',
      protocolo: 'SGI-20260110-H005',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib3.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Alarme de pressão diferencial do filtro',
      motivoDesabilitacao: 'Limpeza programada do filtro de polpa',
      medidasContingenciais: 'Monitoramento visual da pressão pelo painel',
      periodoInicio: daysAgo(95),
      periodoFim: daysAgo(91),
      dataEnvio: daysAgo(96),
      dataAprovacaoFinal: daysAgo(95),
      dataDesabilitacao: daysAgo(94),
      dataReabilitacao: daysAgo(90),
      dataEncerramento: daysAgo(89),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(97),
    },
    // ── 3 meses atrás — C2, Fibras, dentro do prazo
    {
      id: 'seed-hist-ara-06',
      protocolo: 'SGI-20260115-H006',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib4.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção térmica do transformador',
      motivoDesabilitacao: 'Troca de relé de temperatura',
      medidasContingenciais: 'Medição manual com termômetro infravermelho a cada 1h',
      periodoInicio: daysAgo(90),
      periodoFim: daysAgo(86),
      dataEnvio: daysAgo(91),
      dataAprovacaoFinal: daysAgo(90),
      dataDesabilitacao: daysAgo(89),
      dataReabilitacao: daysAgo(85),
      dataEncerramento: daysAgo(84),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(92),
    },
    // ── 3 meses atrás — C3, Caldeira, prazo estourado
    {
      id: 'seed-hist-ara-07',
      protocolo: 'SGI-20260120-H007',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de falha de chama',
      motivoDesabilitacao: 'Defeito no detector de chama UV — aguardando peça importada',
      medidasContingenciais: 'Observação visual contínua, operador dedicado',
      periodoInicio: daysAgo(85),
      periodoFim: daysAgo(82),
      dataEnvio: daysAgo(86),
      dataAprovacaoFinal: daysAgo(85),
      dataDesabilitacao: daysAgo(84),
      dataReabilitacao: daysAgo(78),
      dataEncerramento: daysAgo(77),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(87),
    },
    // ── 2 meses atrás — C2, Caldeira, dentro do prazo
    {
      id: 'seed-hist-ara-08',
      protocolo: 'SGI-20260210-H008',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal2.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Sensor de pressão da linha de vapor',
      motivoDesabilitacao: 'Recalibração trimestral do manômetro',
      medidasContingenciais: 'Uso de manômetro portátil como referência',
      periodoInicio: daysAgo(64),
      periodoFim: daysAgo(61),
      dataEnvio: daysAgo(65),
      dataAprovacaoFinal: daysAgo(64),
      dataDesabilitacao: daysAgo(63),
      dataReabilitacao: daysAgo(60),
      dataEncerramento: daysAgo(59),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(66),
    },
    // ── 2 meses atrás — C4, Fibras, prazo estourado
    {
      id: 'seed-hist-ara-09',
      protocolo: 'SGI-20260218-H009',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib5.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'ESD do digestor — sobrevelocidade do agitador',
      motivoDesabilitacao: 'Falha no encoder do variador de frequência',
      medidasContingenciais: 'Operação manual com velocidade limitada, inspeção a cada 30min',
      periodoInicio: daysAgo(56),
      periodoFim: daysAgo(55),
      dataEnvio: daysAgo(57),
      dataAprovacaoFinal: daysAgo(56),
      dataDesabilitacao: daysAgo(55),
      dataReabilitacao: daysAgo(52),
      dataEncerramento: daysAgo(51),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(58),
    },
    // ── 1 mês atrás — C1, Caldeira, dentro do prazo
    {
      id: 'seed-hist-ara-10',
      protocolo: 'SGI-20260315-H010',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Alarme de vazão de ar de combustão',
      motivoDesabilitacao: 'Troca de placa de orifício com corrosão',
      medidasContingenciais: 'Monitoramento manual de vazão pelo operador',
      periodoInicio: daysAgo(31),
      periodoFim: daysAgo(27),
      dataEnvio: daysAgo(32),
      dataAprovacaoFinal: daysAgo(31),
      dataDesabilitacao: daysAgo(30),
      dataReabilitacao: daysAgo(26),
      dataEncerramento: daysAgo(25),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(33),
    },
    // ── 1 mês atrás — C3, Fibras, prazo estourado (FIB-ABC-001 recorrente)
    {
      id: 'seed-hist-ara-11',
      protocolo: 'SGI-20260320-H011',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib1.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Proteção contra sobretemperatura',
      motivoDesabilitacao: 'Nova falha no termopar — substituição definitiva',
      medidasContingenciais: 'Pirômetro portátil, operador dedicado',
      periodoInicio: daysAgo(26),
      periodoFim: daysAgo(23),
      dataEnvio: daysAgo(27),
      dataAprovacaoFinal: daysAgo(26),
      dataDesabilitacao: daysAgo(25),
      dataReabilitacao: daysAgo(20),
      dataEncerramento: daysAgo(19),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(28),
    },

    // ═══ RIBAS DO RIO PARDO — Meses 1-5 atrás ═══════════════════════════════

    // ── 5 meses atrás — C2, Recuperação, dentro do prazo
    {
      id: 'seed-hist-rrp-01',
      protocolo: 'SGI-20251120-RH01',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de nível do tanque de dissolução',
      motivoDesabilitacao: 'Substituição da boia do indicador de nível',
      medidasContingenciais: 'Medição manual, alarme visual temporário',
      periodoInicio: daysAgo(147),
      periodoFim: daysAgo(143),
      dataEnvio: daysAgo(148),
      dataAprovacaoFinal: daysAgo(147),
      dataDesabilitacao: daysAgo(146),
      dataReabilitacao: daysAgo(142),
      dataEncerramento: daysAgo(141),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(149),
    },
    // ── 4 meses atrás — C1, Celulose, dentro do prazo
    {
      id: 'seed-hist-rrp-02',
      protocolo: 'SGI-20251205-RH02',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção mecânica do lavador',
      motivoDesabilitacao: 'Lubrificação e inspeção programada dos mancais',
      medidasContingenciais: 'Operação com velocidade reduzida',
      periodoInicio: daysAgo(132),
      periodoFim: daysAgo(128),
      dataEnvio: daysAgo(133),
      dataAprovacaoFinal: daysAgo(132),
      dataDesabilitacao: daysAgo(131),
      dataReabilitacao: daysAgo(127),
      dataEncerramento: daysAgo(126),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(134),
    },
    // ── 4 meses atrás — C3, Recuperação, prazo estourado
    {
      id: 'seed-hist-rrp-03',
      protocolo: 'SGI-20251212-RH03',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de nível alto do tanque de licor',
      motivoDesabilitacao: 'Transmissor de nível com desvio — recalibração',
      medidasContingenciais: 'Medição manual com régua, alarme configurado no SDCD',
      periodoInicio: daysAgo(125),
      periodoFim: daysAgo(122),
      dataEnvio: daysAgo(126),
      dataAprovacaoFinal: daysAgo(125),
      dataDesabilitacao: daysAgo(124),
      dataReabilitacao: daysAgo(118),
      dataEncerramento: daysAgo(117),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(127),
    },
    // ── 3 meses atrás — C4, Celulose, prazo estourado
    {
      id: 'seed-hist-rrp-04',
      protocolo: 'SGI-20260108-RH04',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel3.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Válvula de alívio do digestor',
      motivoDesabilitacao: 'Requalificação obrigatória da válvula de segurança',
      medidasContingenciais: 'Redução de pressão operacional, disco de ruptura temporário instalado',
      periodoInicio: daysAgo(97),
      periodoFim: daysAgo(96),
      dataEnvio: daysAgo(98),
      dataAprovacaoFinal: daysAgo(97),
      dataDesabilitacao: daysAgo(96),
      dataReabilitacao: daysAgo(93),
      dataEncerramento: daysAgo(92),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(99),
    },
    // ── 3 meses atrás — C2, Recuperação, dentro do prazo
    {
      id: 'seed-hist-rrp-05',
      protocolo: 'SGI-20260118-RH05',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec3.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Proteção do selo mecânico da bomba',
      motivoDesabilitacao: 'Troca preventiva do selo mecânico',
      medidasContingenciais: 'Bomba reserva em standby, monitoramento de vazamento',
      periodoInicio: daysAgo(87),
      periodoFim: daysAgo(83),
      dataEnvio: daysAgo(88),
      dataAprovacaoFinal: daysAgo(87),
      dataDesabilitacao: daysAgo(86),
      dataReabilitacao: daysAgo(83),
      dataEncerramento: daysAgo(82),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(89),
    },
    // ── 2 meses atrás — C1, Celulose, dentro do prazo
    {
      id: 'seed-hist-rrp-06',
      protocolo: 'SGI-20260205-RH06',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel2.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Controle de consistência on-line',
      motivoDesabilitacao: 'Limpeza e recalibração do sensor óptico',
      medidasContingenciais: 'Amostragem manual de consistência a cada 2h',
      periodoInicio: daysAgo(69),
      periodoFim: daysAgo(65),
      dataEnvio: daysAgo(70),
      dataAprovacaoFinal: daysAgo(69),
      dataDesabilitacao: daysAgo(68),
      dataReabilitacao: daysAgo(64),
      dataEncerramento: daysAgo(63),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(71),
    },
    // ── 2 meses atrás — C3, Recuperação, prazo estourado (REC-VLV-001 recorrente)
    {
      id: 'seed-hist-rrp-07',
      protocolo: 'SGI-20260215-RH07',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Bloqueio de alimentação caldeira de recuperação',
      motivoDesabilitacao: 'Novo vazamento na sede da válvula — reparo definitivo',
      medidasContingenciais: 'Bypass com válvula manual, operador na área',
      periodoInicio: daysAgo(59),
      periodoFim: daysAgo(56),
      dataEnvio: daysAgo(60),
      dataAprovacaoFinal: daysAgo(59),
      dataDesabilitacao: daysAgo(58),
      dataReabilitacao: daysAgo(52),
      dataEncerramento: daysAgo(51),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(61),
    },
    // ── 1 mês atrás — C2, Celulose, dentro do prazo
    {
      id: 'seed-hist-rrp-08',
      protocolo: 'SGI-20260310-RH08',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Proteção de sobrecarga do motor do lavador',
      motivoDesabilitacao: 'Atualização de firmware do relé de proteção',
      medidasContingenciais: 'Monitoramento de corrente pelo painel, limite manual programado',
      periodoInicio: daysAgo(36),
      periodoFim: daysAgo(33),
      dataEnvio: daysAgo(37),
      dataAprovacaoFinal: daysAgo(36),
      dataDesabilitacao: daysAgo(35),
      dataReabilitacao: daysAgo(32),
      dataEncerramento: daysAgo(31),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(38),
    },
    // ── 1 mês atrás — C4, Recuperação, prazo estourado
    {
      id: 'seed-hist-rrp-09',
      protocolo: 'SGI-20260318-RH09',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec2.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de alta pressão do evaporador',
      motivoDesabilitacao: 'Falha crítica no transmissor de pressão — substituição',
      medidasContingenciais: 'Manômetro analógico, operador dedicado, redução de carga',
      periodoInicio: daysAgo(28),
      periodoFim: daysAgo(27),
      dataEnvio: daysAgo(29),
      dataAprovacaoFinal: daysAgo(28),
      dataDesabilitacao: daysAgo(27),
      dataReabilitacao: daysAgo(24),
      dataEncerramento: daysAgo(23),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(30),
    },
  ]

  for (const sol of historicoSolicitacoes) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Aprovações do histórico (todas aprovadas, ciclo completo)
  const historicoAprovacoes: any[] = []
  for (const sol of historicoSolicitacoes) {
    const classeNumero = sol.classeId === classe1.id ? 1
      : sol.classeId === classe2.id ? 2
      : sol.classeId === classe3.id ? 3
      : 4

    // Nível 1 — todos
    historicoAprovacoes.push({
      solicitacaoId: sol.id,
      aprovadorId: aprovador1.id,
      nivel: 1,
      tipo: 'DESABILITACAO',
      status: 'APROVADO',
      respondidaEm: sol.dataAprovacaoFinal,
    })
    // Nível 2 — classes ≥ 2
    if (classeNumero >= 2) {
      historicoAprovacoes.push({
        solicitacaoId: sol.id,
        aprovadorId: aprovador2.id,
        nivel: 2,
        tipo: 'DESABILITACAO',
        status: 'APROVADO',
        respondidaEm: sol.dataAprovacaoFinal,
      })
    }
    // Nível 3 — classe 4
    if (classeNumero >= 4) {
      historicoAprovacoes.push({
        solicitacaoId: sol.id,
        aprovadorId: gestor.id,
        nivel: 3,
        tipo: 'DESABILITACAO',
        status: 'APROVADO',
        respondidaEm: sol.dataAprovacaoFinal,
      })
    }
  }

  for (const aprov of historicoAprovacoes) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  // Eventos de auditoria do histórico (ciclo completo)
  const historicoEventos: any[] = []
  for (const sol of historicoSolicitacoes) {
    historicoEventos.push(
      { solicitacaoId: sol.id, userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: sol.dataEnvio },
      { solicitacaoId: sol.id, userId: aprovador1.id, acao: 'APROVADO', createdAt: sol.dataAprovacaoFinal },
      { solicitacaoId: sol.id, userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: sol.dataDesabilitacao },
      { solicitacaoId: sol.id, userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: sol.dataReabilitacao },
      { solicitacaoId: sol.id, userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: sol.dataEncerramento },
    )
  }

  for (const evt of historicoEventos) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 20 solicitações históricas criadas (Aracruz: 11, Ribas: 9) — classes 1-4, meses 1-5 atrás')

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
