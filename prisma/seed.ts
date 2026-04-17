import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertPerfil(data: { userId: string; perfil: string; plantaId?: string | null; areaId?: string | null }) {
  const existing = await prisma.usuarioPerfil.findFirst({
    where: { userId: data.userId, perfil: data.perfil, plantaId: data.plantaId ?? null, areaId: data.areaId ?? null },
  })
  if (!existing) {
    await prisma.usuarioPerfil.create({ data })
  }
}

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
  const equipsFibrasData = [
    { tag: 'FIB-ABC-001', descricao: 'Analisador de consistência — Linha 1', funcaoProtegida: 'Proteção contra sobrepressão', tipo: 'LOGICO', classeNumero: 2 },
    { tag: 'FIB-BOM-032', descricao: 'Bomba de vácuo do filtro de polpa', funcaoProtegida: 'Proteção térmica do motor', tipo: 'FISICO', classeNumero: 2 },
    { tag: 'FIB-VAL-107', descricao: 'Válvula de emergência do digestor', funcaoProtegida: 'Trip de alta temperatura da caldeira', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'FIB-SEN-044', descricao: 'Sensor de nível do tanque de licor', funcaoProtegida: 'Bloqueio de válvula de emergência', tipo: 'DISPOSITIVO_SEGURANCA', classeNumero: 3 },
    { tag: 'FIB-MOT-015', descricao: 'Motor do agitador do digestor', funcaoProtegida: 'Shutdown de emergência do digestor', tipo: 'FISICO', classeNumero: 4 },
  ]
  for (const eq of equipsFibrasData) {
    await prisma.equipamento.upsert({
      where: { tag: eq.tag },
      update: { funcaoProtegida: eq.funcaoProtegida, tipo: eq.tipo, classeNumero: eq.classeNumero },
      create: { ...eq, areaId: areaFibras.id },
    })
  }

  const equipsCaldData = [
    { tag: 'CAL-VLV-001', descricao: 'Válvula de segurança da caldeira', funcaoProtegida: 'Proteção contra sobrevelocidade do motor', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'CAL-SEN-022', descricao: 'Sensor de temperatura da caldeira', funcaoProtegida: 'Alarme de sobretemperatura', tipo: 'LOGICO', classeNumero: 2 },
    { tag: 'CAL-PMP-003', descricao: 'Bomba de água da caldeira', funcaoProtegida: 'Trip de nível baixo do tambor', tipo: 'FISICO', classeNumero: 4 },
  ]
  for (const eq of equipsCaldData) {
    await prisma.equipamento.upsert({
      where: { tag: eq.tag },
      update: { funcaoProtegida: eq.funcaoProtegida, tipo: eq.tipo, classeNumero: eq.classeNumero },
      create: { ...eq, areaId: areaCaldeira.id },
    })
  }

  // ── Equipamentos Limeira ───────────────────────────────────────────────────
  const equipsLimeiraData = [
    { tag: 'PRD-BOM-001', descricao: 'Bomba de alimentação principal', funcaoProtegida: 'Proteção contra sobrecarga', tipo: 'FISICO', classeNumero: 2 },
    { tag: 'PRD-VAL-002', descricao: 'Válvula de controle de pressão', funcaoProtegida: 'Alívio de sobrepressão', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'PRD-SEN-010', descricao: 'Sensor de temperatura do forno', funcaoProtegida: 'Trip de sobretemperatura', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'PRD-MOT-003', descricao: 'Motor principal do misturador', funcaoProtegida: 'Proteção de sobrecarga do motor', tipo: 'FISICO', classeNumero: 4 },
  ]
  for (const eq of equipsLimeiraData) {
    await prisma.equipamento.upsert({
      where: { tag: eq.tag },
      update: { funcaoProtegida: eq.funcaoProtegida, tipo: eq.tipo, classeNumero: eq.classeNumero },
      create: { ...eq, areaId: areaLimeira.id },
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
  await upsertPerfil(
    { userId: admin.id, perfil: 'ADMINISTRADOR', plantaId: planta.id },
  )

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
  await upsertPerfil(
    { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: planta.id, areaId: areaFibras.id },
  )
  // Demo: João também tem perfil APROVADOR e EXECUTANTE para testar o switcher
  await upsertPerfil(
    { userId: solicitante.id, perfil: 'APROVADOR', plantaId: planta.id },
  )
  await upsertPerfil(
    { userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: planta.id, areaId: areaFibras.id },
  )
  // Demo: João também acessa Limeira (segunda planta) como Solicitante e Executante
  await upsertPerfil(
    { userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: plantaLimeira.id, areaId: areaLimeira.id },
  )
  await upsertPerfil(
    { userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: plantaLimeira.id, areaId: areaLimeira.id },
  )

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
  await upsertPerfil(
    { userId: executante.id, perfil: 'EXECUTANTE', plantaId: planta.id, areaId: areaFibras.id },
  )

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
  await upsertPerfil(
    { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: planta.id, areaId: areaFibras.id },
  )

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
  await upsertPerfil(
    { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: planta.id, areaId: areaFibras.id },
  )

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
  await upsertPerfil(
    { userId: gestor.id, perfil: 'GESTOR_SMS', plantaId: planta.id },
  )

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
        await upsertPerfil(
          { userId: gestor.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
        )
      }
    }
    // Garantir que aprovador1 e aprovador2 têm perfil APROVADOR na planta Limeira também
    await upsertPerfil(
      { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
    )
    await upsertPerfil(
      { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: plantaItem.id },
    )
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

  // 4 novas áreas Ribas
  const areaPatio = await prisma.area.upsert({
    where: { id: 'area-rrp-patio' },
    update: {},
    create: { id: 'area-rrp-patio', nome: 'Pátio de Madeira', codigo: 'PAT', plantaId: plantaRibas.id },
  })

  const areaSecagem = await prisma.area.upsert({
    where: { id: 'area-rrp-secagem' },
    update: {},
    create: { id: 'area-rrp-secagem', nome: 'Secagem', codigo: 'SEC', plantaId: plantaRibas.id },
  })

  const areaDigestor = await prisma.area.upsert({
    where: { id: 'area-rrp-digestor' },
    update: {},
    create: { id: 'area-rrp-digestor', nome: 'Digestor e Cozimento', codigo: 'DIG', plantaId: plantaRibas.id },
  })

  const areaEta = await prisma.area.upsert({
    where: { id: 'area-rrp-eta' },
    update: {},
    create: { id: 'area-rrp-eta', nome: 'ETA / ETE', codigo: 'ETA', plantaId: plantaRibas.id },
  })

  // Equipamentos Ribas (existentes + novos)
  const equipsRibas = [
    // Recuperação e Utilidades
    { tag: 'REC-VLV-001', descricao: 'Válvula de bloqueio caldeira de recuperação', areaId: areaRecuperacao.id, funcaoProtegida: 'Bloqueio de alimentação caldeira de recuperação', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'REC-SEN-012', descricao: 'Sensor de nível tanque de licor', areaId: areaRecuperacao.id, funcaoProtegida: 'Trip de nível alto do tanque de licor', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'REC-PMP-005', descricao: 'Bomba de licor verde', areaId: areaRecuperacao.id, funcaoProtegida: 'Intertravamento de proteção da bomba de licor verde', tipo: 'LOGICO', classeNumero: 2 },
    // Linha de Celulose
    { tag: 'CEL-MOT-008', descricao: 'Motor principal do lavador', areaId: areaCelulose.id, funcaoProtegida: 'Proteção do motor principal do lavador', tipo: 'FISICO', classeNumero: 2 },
    { tag: 'CEL-SEN-021', descricao: 'Sensor de consistência da polpa', areaId: areaCelulose.id, funcaoProtegida: 'Controle de consistência da polpa', tipo: 'DISPOSITIVO_SEGURANCA', classeNumero: 3 },
    { tag: 'CEL-VLV-015', descricao: 'Válvula de segurança do digestor', areaId: areaCelulose.id, funcaoProtegida: 'Válvula de segurança do digestor — alívio de pressão', tipo: 'FISICO', classeNumero: 4 },
    // Pátio de Madeira
    { tag: 'PAT-EST-001', descricao: 'Esteira transportadora de cavacos', areaId: areaPatio.id, funcaoProtegida: 'Proteção de parada de emergência da esteira', tipo: 'FISICO', classeNumero: 2 },
    { tag: 'PAT-DET-003', descricao: 'Detector de metais na linha de cavacos', areaId: areaPatio.id, funcaoProtegida: 'Bloqueio por detecção de corpo metálico', tipo: 'DISPOSITIVO_SEGURANCA', classeNumero: 3 },
    // Secagem
    { tag: 'SEC-SEN-007', descricao: 'Sensor de temperatura do secador', areaId: areaSecagem.id, funcaoProtegida: 'Trip por sobretemperatura do secador', tipo: 'LOGICO', classeNumero: 3 },
    { tag: 'SEC-VLV-010', descricao: 'Válvula de vapor da máquina de secagem', areaId: areaSecagem.id, funcaoProtegida: 'Bloqueio de vapor na máquina de celulose', tipo: 'LOGICO', classeNumero: 2 },
    // Digestor e Cozimento
    { tag: 'DIG-PSV-002', descricao: 'Válvula de alívio de pressão do digestor', areaId: areaDigestor.id, funcaoProtegida: 'Alívio de sobrepressão do digestor contínuo', tipo: 'FISICO', classeNumero: 4 },
    { tag: 'DIG-SEN-006', descricao: 'Sensor de nível do digestor', areaId: areaDigestor.id, funcaoProtegida: 'Trip de nível alto do digestor', tipo: 'LOGICO', classeNumero: 3 },
    // ETA / ETE
    { tag: 'ETA-PMP-004', descricao: 'Bomba dosadora de produto químico', areaId: areaEta.id, funcaoProtegida: 'Intertravamento de dosagem química', tipo: 'LOGICO', classeNumero: 2 },
    { tag: 'ETA-SEN-009', descricao: 'Sensor de pH do efluente', areaId: areaEta.id, funcaoProtegida: 'Bloqueio por pH fora da faixa', tipo: 'DISPOSITIVO_SEGURANCA', classeNumero: 3 },
  ]
  for (const eq of equipsRibas) {
    await prisma.equipamento.upsert({
      where: { tag: eq.tag },
      update: { funcaoProtegida: eq.funcaoProtegida, tipo: eq.tipo, classeNumero: eq.classeNumero },
      create: eq,
    })
  }

  const eqRec1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-VLV-001' } })
  const eqRec2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-SEN-012' } })
  const eqRec3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'REC-PMP-005' } })
  const eqCel1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-MOT-008' } })
  const eqCel2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-SEN-021' } })
  const eqCel3 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'CEL-VLV-015' } })
  // Novos equipamentos
  const eqPat1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'PAT-EST-001' } })
  const eqPat2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'PAT-DET-003' } })
  const eqSec1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'SEC-SEN-007' } })
  const eqSec2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'SEC-VLV-010' } })
  const eqDig1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'DIG-PSV-002' } })
  const eqDig2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'DIG-SEN-006' } })
  const eqEta1 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'ETA-PMP-004' } })
  const eqEta2 = await prisma.equipamento.findUniqueOrThrow({ where: { tag: 'ETA-SEN-009' } })

  // Perfis para Ribas (reaproveitar os mesmos usuários — todas as áreas)
  await upsertPerfil(
    { userId: admin.id, perfil: 'ADMINISTRADOR', plantaId: plantaRibas.id },
  )
  // João: Solicitante + Executante em Recuperação, Pátio, Digestor
  for (const areaRibas of [areaRecuperacao, areaPatio, areaDigestor]) {
    await upsertPerfil({ userId: solicitante.id, perfil: 'SOLICITANTE', plantaId: plantaRibas.id, areaId: areaRibas.id })
    await upsertPerfil({ userId: solicitante.id, perfil: 'EXECUTANTE', plantaId: plantaRibas.id, areaId: areaRibas.id })
  }
  // Carlos: Executante em Celulose, Secagem, ETA
  for (const areaRibas of [areaCelulose, areaSecagem, areaEta]) {
    await upsertPerfil({ userId: executante.id, perfil: 'EXECUTANTE', plantaId: plantaRibas.id, areaId: areaRibas.id })
  }

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
  await upsertPerfil(
    { userId: aprovador1.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  )
  await upsertPerfil(
    { userId: aprovador2.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  )
  await upsertPerfil(
    { userId: gestor.id, perfil: 'APROVADOR', plantaId: plantaRibas.id },
  )
  await upsertPerfil(
    { userId: gestor.id, perfil: 'GESTOR_SMS', plantaId: plantaRibas.id },
  )

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

  // ── Solicitações novas áreas Ribas — 2 por área, status variados ────────────

  const seedSolNovasAreas = [
    // Pátio de Madeira — 1 DESABILITADO, 1 EM_APROVACAO
    {
      id: 'seed-sol-rrp-pat-01',
      protocolo: 'SGI-20260414-P001',
      status: 'DESABILITADO',
      areaId: areaPatio.id,
      equipamentoId: eqPat1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção de parada de emergência da esteira',
      motivoDesabilitacao: 'Substituição de sensor de velocidade da esteira transportadora',
      medidasContingenciais: 'Monitoramento visual contínuo, operador dedicado',
      periodoInicio: daysAgo(3),
      periodoFim: daysAgo(-4),
      dataEnvio: daysAgo(5),
      dataAprovacaoFinal: daysAgo(4),
      dataDesabilitacao: daysAgo(3),
      createdAt: daysAgo(5),
    },
    {
      id: 'seed-sol-rrp-pat-02',
      protocolo: 'SGI-20260415-P002',
      status: 'EM_APROVACAO',
      areaId: areaPatio.id,
      equipamentoId: eqPat2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Bloqueio por detecção de corpo metálico',
      motivoDesabilitacao: 'Recalibração do detector de metais após alarmes falsos',
      medidasContingenciais: 'Inspeção visual manual dos cavacos, barreira na entrada',
      periodoInicio: daysAgo(0),
      periodoFim: daysAgo(-3),
      dataEnvio: daysAgo(1),
      createdAt: daysAgo(1),
    },
    // Secagem — 1 EXECUCAO_AUTORIZADA, 1 ENCERRADA
    {
      id: 'seed-sol-rrp-sec-01',
      protocolo: 'SGI-20260413-S001',
      status: 'EXECUCAO_AUTORIZADA',
      areaId: areaSecagem.id,
      equipamentoId: eqSec1.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip por sobretemperatura do secador',
      motivoDesabilitacao: 'Manutenção preventiva no termopar e fiação',
      medidasContingenciais: 'Medição manual de temperatura a cada 30 min',
      periodoInicio: daysAgo(0),
      periodoFim: daysAgo(-2),
      dataEnvio: daysAgo(3),
      dataAprovacaoFinal: daysAgo(1),
      createdAt: daysAgo(3),
    },
    {
      id: 'seed-sol-rrp-sec-02',
      protocolo: 'SGI-20260410-S002',
      status: 'ENCERRADA',
      areaId: areaSecagem.id,
      equipamentoId: eqSec2.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Bloqueio de vapor na máquina de celulose',
      motivoDesabilitacao: 'Troca de válvula solenóide de vapor',
      medidasContingenciais: 'Controle manual da válvula, operador dedicado',
      periodoInicio: daysAgo(12),
      periodoFim: daysAgo(8),
      dataEnvio: daysAgo(14),
      dataAprovacaoFinal: daysAgo(13),
      dataDesabilitacao: daysAgo(12),
      dataReabilitacao: daysAgo(9),
      dataEncerramento: daysAgo(8),
      createdAt: daysAgo(14),
    },
    // Digestor e Cozimento — 1 RASCUNHO, 1 EM_VALIDACAO_DA_REABILITACAO
    {
      id: 'seed-sol-rrp-dig-01',
      protocolo: 'SGI-20260416-D001',
      status: 'RASCUNHO',
      areaId: areaDigestor.id,
      equipamentoId: eqDig1.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Alívio de sobrepressão do digestor contínuo',
      motivoDesabilitacao: 'Teste de integridade da válvula PSV',
      medidasContingenciais: 'Redução de pressão operacional, monitoramento contínuo',
      periodoInicio: daysAgo(0),
      periodoFim: daysAgo(-1),
      createdAt: daysAgo(0),
    },
    {
      id: 'seed-sol-rrp-dig-02',
      protocolo: 'SGI-20260411-D002',
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      areaId: areaDigestor.id,
      equipamentoId: eqDig2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de nível alto do digestor',
      motivoDesabilitacao: 'Substituição de transmissor de nível com erro de medição',
      medidasContingenciais: 'Leitura manual do visor de nível, operador dedicado',
      periodoInicio: daysAgo(6),
      periodoFim: daysAgo(2),
      dataEnvio: daysAgo(8),
      dataAprovacaoFinal: daysAgo(7),
      dataDesabilitacao: daysAgo(6),
      dataReabilitacao: daysAgo(3),
      createdAt: daysAgo(8),
    },
    // ETA / ETE — 1 CANCELADA, 1 DESABILITADO
    {
      id: 'seed-sol-rrp-eta-01',
      protocolo: 'SGI-20260409-E001',
      status: 'CANCELADA',
      areaId: areaEta.id,
      equipamentoId: eqEta1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Intertravamento de dosagem química',
      motivoDesabilitacao: 'Calibração da bomba dosadora',
      medidasContingenciais: 'Dosagem manual, monitoramento de pH',
      periodoInicio: daysAgo(10),
      periodoFim: daysAgo(8),
      dataEnvio: daysAgo(11),
      createdAt: daysAgo(11),
    },
    {
      id: 'seed-sol-rrp-eta-02',
      protocolo: 'SGI-20260414-E002',
      status: 'DESABILITADO',
      areaId: areaEta.id,
      equipamentoId: eqEta2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Bloqueio por pH fora da faixa',
      motivoDesabilitacao: 'Troca de eletrodo de pH com leitura errática',
      medidasContingenciais: 'Coleta manual de amostras a cada 2h, análise laboratorial',
      periodoInicio: daysAgo(2),
      periodoFim: daysAgo(-3),
      dataEnvio: daysAgo(4),
      dataAprovacaoFinal: daysAgo(3),
      dataDesabilitacao: daysAgo(2),
      createdAt: daysAgo(4),
    },
  ]

  for (const sol of seedSolNovasAreas) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Aprovações novas áreas
  const seedAprovacoesNovasAreas = [
    // PAT-01 (DESABILITADO): aprovada
    { solicitacaoId: 'seed-sol-rrp-pat-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-pat-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(4) },
    // PAT-02 (EM_APROVACAO): Ana pendente
    { solicitacaoId: 'seed-sol-rrp-pat-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'PENDENTE' },
    { solicitacaoId: 'seed-sol-rrp-pat-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'AGUARDANDO' },
    // SEC-01 (EXECUCAO_AUTORIZADA): aprovada
    { solicitacaoId: 'seed-sol-rrp-sec-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(2) },
    { solicitacaoId: 'seed-sol-rrp-sec-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(1) },
    // SEC-02 (ENCERRADA): aprovada
    { solicitacaoId: 'seed-sol-rrp-sec-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(13) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(13) },
    // DIG-02 (EM_VALIDACAO): aprovada
    { solicitacaoId: 'seed-sol-rrp-dig-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(7) },
    { solicitacaoId: 'seed-sol-rrp-dig-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(7) },
    // ETA-01 (CANCELADA): foi aprovada mas depois cancelada
    { solicitacaoId: 'seed-sol-rrp-eta-01', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(10) },
    { solicitacaoId: 'seed-sol-rrp-eta-01', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(10) },
    // ETA-02 (DESABILITADO): aprovada
    { solicitacaoId: 'seed-sol-rrp-eta-02', aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-eta-02', aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: daysAgo(3) },
  ]

  for (const aprov of seedAprovacoesNovasAreas) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  // Eventos novas áreas
  const seedEventosNovasAreas = [
    { solicitacaoId: 'seed-sol-rrp-pat-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(5) },
    { solicitacaoId: 'seed-sol-rrp-pat-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-pat-01', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-pat-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(1) },
    { solicitacaoId: 'seed-sol-rrp-sec-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-sec-01', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(2) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(14) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(13) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(12) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(9) },
    { solicitacaoId: 'seed-sol-rrp-sec-02', userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: daysAgo(8) },
    { solicitacaoId: 'seed-sol-rrp-dig-01', userId: solicitante.id, acao: 'RASCUNHO_CRIADO', createdAt: daysAgo(0) },
    { solicitacaoId: 'seed-sol-rrp-dig-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(8) },
    { solicitacaoId: 'seed-sol-rrp-dig-02', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(7) },
    { solicitacaoId: 'seed-sol-rrp-dig-02', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(6) },
    { solicitacaoId: 'seed-sol-rrp-dig-02', userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-eta-01', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(11) },
    { solicitacaoId: 'seed-sol-rrp-eta-01', userId: solicitante.id, acao: 'CANCELADA', detalhes: 'Equipamento substituído, não precisa mais calibrar', createdAt: daysAgo(9) },
    { solicitacaoId: 'seed-sol-rrp-eta-02', userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: daysAgo(4) },
    { solicitacaoId: 'seed-sol-rrp-eta-02', userId: aprovador1.id, acao: 'APROVADO', createdAt: daysAgo(3) },
    { solicitacaoId: 'seed-sol-rrp-eta-02', userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: daysAgo(2) },
  ]

  for (const evt of seedEventosNovasAreas) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 14 solicitações Ribas do Rio Pardo (6 áreas: Recuperação, Celulose, Pátio, Secagem, Digestor, ETA)')

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

  // ── Solicitações extras para popular o gráfico de ciclo de vida ───────────
  // Com tempos significativos entre etapas (aprovação, execução, desabilitado, reabilitação)

  const cicloVidaSolicitacoes = [
    // ═══ ARACRUZ ═════════════════════════════════════════════════════════════

    // C1 — aprovação 1d, execução 1d, desabilitado 3d, reabilitação 2d
    {
      id: 'seed-ciclo-ara-c1-a',
      protocolo: 'SGI-20260201-CV01',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Alarme de nível baixo do tanque de polpa',
      motivoDesabilitacao: 'Limpeza do sensor ultrassônico de nível',
      medidasContingenciais: 'Medição manual com trena a cada 2h',
      periodoInicio: daysAgo(73),
      periodoFim: daysAgo(66),
      dataEnvio: daysAgo(73),
      dataAprovacaoFinal: daysAgo(72),
      dataDesabilitacao: daysAgo(71),
      dataReabilitacao: daysAgo(68),
      dataEncerramento: daysAgo(66),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(74),
    },
    // C1 — aprovação 2d, execução 1d, desabilitado 4d, reabilitação 1d
    {
      id: 'seed-ciclo-ara-c1-b',
      protocolo: 'SGI-20260225-CV02',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Sensor de vazão de água de resfriamento',
      motivoDesabilitacao: 'Troca de elemento sensor com corrosão',
      medidasContingenciais: 'Monitoramento manual da temperatura de saída',
      periodoInicio: daysAgo(49),
      periodoFim: daysAgo(42),
      dataEnvio: daysAgo(50),
      dataAprovacaoFinal: daysAgo(48),
      dataDesabilitacao: daysAgo(47),
      dataReabilitacao: daysAgo(43),
      dataEncerramento: daysAgo(42),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(51),
    },

    // C2 — aprovação 2d, execução 2d, desabilitado 3d, reabilitação 2d
    {
      id: 'seed-ciclo-ara-c2-a',
      protocolo: 'SGI-20260205-CV03',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib2.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de alta vibração do agitador',
      motivoDesabilitacao: 'Balanceamento dinâmico do eixo',
      medidasContingenciais: 'Velocidade reduzida, monitoramento contínuo',
      periodoInicio: daysAgo(69),
      periodoFim: daysAgo(60),
      dataEnvio: daysAgo(70),
      dataAprovacaoFinal: daysAgo(68),
      dataDesabilitacao: daysAgo(66),
      dataReabilitacao: daysAgo(63),
      dataEncerramento: daysAgo(61),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(71),
    },
    // C2 — aprovação 1d, execução 1d, desabilitado 6d, reabilitação 3d (prazo estourado)
    {
      id: 'seed-ciclo-ara-c2-b',
      protocolo: 'SGI-20260301-CV04',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal3.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Proteção contra retorno de vapor',
      motivoDesabilitacao: 'Troca de válvula de retenção com mau funcionamento',
      medidasContingenciais: 'Válvula manual operada, monitoramento de pressão',
      periodoInicio: daysAgo(45),
      periodoFim: daysAgo(38),
      dataEnvio: daysAgo(46),
      dataAprovacaoFinal: daysAgo(45),
      dataDesabilitacao: daysAgo(44),
      dataReabilitacao: daysAgo(38),
      dataEncerramento: daysAgo(35),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(47),
    },

    // C3 — aprovação 1d, execução 1d, desabilitado 2d, reabilitação 1d
    {
      id: 'seed-ciclo-ara-c3-a',
      protocolo: 'SGI-20260210-CV05',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'ESD por alta pressão do reator',
      motivoDesabilitacao: 'Falha no transmissor de pressão — troca urgente',
      medidasContingenciais: 'Manômetro local, operador dedicado, carga a 50%',
      periodoInicio: daysAgo(64),
      periodoFim: daysAgo(60),
      dataEnvio: daysAgo(65),
      dataAprovacaoFinal: daysAgo(64),
      dataDesabilitacao: daysAgo(63),
      dataReabilitacao: daysAgo(61),
      dataEncerramento: daysAgo(60),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(66),
    },
    // C3 — aprovação 1d, execução 1d, desabilitado 5d, reabilitação 2d (prazo estourado)
    {
      id: 'seed-ciclo-ara-c3-b',
      protocolo: 'SGI-20260305-CV06',
      status: 'ENCERRADA',
      areaId: areaCaldeira.id,
      equipamentoId: equipCal2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Trip de falha de ignição do queimador',
      motivoDesabilitacao: 'Substituição do eletrodo de ignição danificado',
      medidasContingenciais: 'Ignição manual supervisionada, extintor posicionado',
      periodoInicio: daysAgo(41),
      periodoFim: daysAgo(38),
      dataEnvio: daysAgo(42),
      dataAprovacaoFinal: daysAgo(41),
      dataDesabilitacao: daysAgo(40),
      dataReabilitacao: daysAgo(35),
      dataEncerramento: daysAgo(33),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(43),
    },

    // C4 — aprovação 1d, execução 1d, desabilitado 1d, reabilitação 1d (rápido, dentro do prazo)
    {
      id: 'seed-ciclo-ara-c4-a',
      protocolo: 'SGI-20260215-CV07',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib4.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Shutdown de emergência do evaporador',
      motivoDesabilitacao: 'Reset do módulo de segurança após falha espúria',
      medidasContingenciais: 'Operação manual total, equipe de emergência em standby',
      periodoInicio: daysAgo(59),
      periodoFim: daysAgo(58),
      dataEnvio: daysAgo(60),
      dataAprovacaoFinal: daysAgo(59),
      dataDesabilitacao: daysAgo(58),
      dataReabilitacao: daysAgo(57),
      dataEncerramento: daysAgo(56),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(61),
    },
    // C4 — aprovação 1d, execução 1d, desabilitado 3d, reabilitação 2d (prazo estourado)
    {
      id: 'seed-ciclo-ara-c4-b',
      protocolo: 'SGI-20260310-CV08',
      status: 'ENCERRADA',
      areaId: areaFibras.id,
      equipamentoId: equipFib5.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Bloqueio por detecção de gás H2S',
      motivoDesabilitacao: 'Detector de gás fora de calibração — recertificação',
      medidasContingenciais: 'Detector portátil, área isolada, EPI respiratório obrigatório',
      periodoInicio: daysAgo(36),
      periodoFim: daysAgo(35),
      dataEnvio: daysAgo(37),
      dataAprovacaoFinal: daysAgo(36),
      dataDesabilitacao: daysAgo(35),
      dataReabilitacao: daysAgo(32),
      dataEncerramento: daysAgo(30),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(38),
    },

    // ═══ RIBAS DO RIO PARDO ═════════════════════════════════════════════════

    // C1 — aprovação 1d, execução 2d, desabilitado 5d, reabilitação 2d
    {
      id: 'seed-ciclo-rrp-c1-a',
      protocolo: 'SGI-20260208-RCV01',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe1.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Alarme de temperatura do licor negro',
      motivoDesabilitacao: 'Recalibração do termopar de imersão',
      medidasContingenciais: 'Pirômetro portátil, verificação manual',
      periodoInicio: daysAgo(66),
      periodoFim: daysAgo(56),
      dataEnvio: daysAgo(67),
      dataAprovacaoFinal: daysAgo(66),
      dataDesabilitacao: daysAgo(64),
      dataReabilitacao: daysAgo(59),
      dataEncerramento: daysAgo(57),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(68),
    },
    // C2 — aprovação 2d, execução 1d, desabilitado 4d, reabilitação 2d
    {
      id: 'seed-ciclo-rrp-c2-a',
      protocolo: 'SGI-20260220-RCV02',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel2.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO',
      funcaoIntertravamento: 'Proteção contra sobrecarga do filtro',
      motivoDesabilitacao: 'Troca da tela filtrante com desgaste',
      medidasContingenciais: 'Bypass parcial, monitoramento de pressão diferencial',
      periodoInicio: daysAgo(54),
      periodoFim: daysAgo(46),
      dataEnvio: daysAgo(55),
      dataAprovacaoFinal: daysAgo(53),
      dataDesabilitacao: daysAgo(52),
      dataReabilitacao: daysAgo(48),
      dataEncerramento: daysAgo(46),
      prazoMaximoAtingido: false,
      createdAt: daysAgo(56),
    },
    // C3 — aprovação 1d, execução 1d, desabilitado 4d, reabilitação 1d (prazo estourado)
    {
      id: 'seed-ciclo-rrp-c3-a',
      protocolo: 'SGI-20260228-RCV03',
      status: 'ENCERRADA',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO',
      funcaoIntertravamento: 'Trip de pressão alta do evaporador',
      motivoDesabilitacao: 'Válvula de controle travada — reparo do atuador',
      medidasContingenciais: 'Operação manual da válvula, redução de carga',
      periodoInicio: daysAgo(46),
      periodoFim: daysAgo(43),
      dataEnvio: daysAgo(47),
      dataAprovacaoFinal: daysAgo(46),
      dataDesabilitacao: daysAgo(45),
      dataReabilitacao: daysAgo(41),
      dataEncerramento: daysAgo(40),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(48),
    },
    // C4 — aprovação 1d, execução 1d, desabilitado 2d, reabilitação 1d (prazo estourado)
    {
      id: 'seed-ciclo-rrp-c4-a',
      protocolo: 'SGI-20260312-RCV04',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel3.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA',
      funcaoIntertravamento: 'Válvula de segurança do digestor — alívio',
      motivoDesabilitacao: 'Teste hidrostático obrigatório — NR-13',
      medidasContingenciais: 'Disco de ruptura temporário, pressão reduzida, supervisor dedicado',
      periodoInicio: daysAgo(34),
      periodoFim: daysAgo(33),
      dataEnvio: daysAgo(35),
      dataAprovacaoFinal: daysAgo(34),
      dataDesabilitacao: daysAgo(33),
      dataReabilitacao: daysAgo(31),
      dataEncerramento: daysAgo(30),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(36),
    },
  ]

  for (const sol of cicloVidaSolicitacoes) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Aprovações e eventos para ciclo de vida
  const cicloAprovacoes: any[] = []
  const cicloEventos: any[] = []
  for (const sol of cicloVidaSolicitacoes) {
    const classeNumero = sol.classeId === classe1.id ? 1
      : sol.classeId === classe2.id ? 2
      : sol.classeId === classe3.id ? 3 : 4

    cicloAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    if (classeNumero >= 2) {
      cicloAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    }
    if (classeNumero >= 4) {
      cicloAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    }

    cicloEventos.push(
      { solicitacaoId: sol.id, userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: sol.dataEnvio },
      { solicitacaoId: sol.id, userId: aprovador1.id, acao: 'APROVADO', createdAt: sol.dataAprovacaoFinal },
      { solicitacaoId: sol.id, userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: sol.dataDesabilitacao },
      { solicitacaoId: sol.id, userId: executante.id, acao: 'REABILITACAO_CONCLUIDA', createdAt: sol.dataReabilitacao },
      { solicitacaoId: sol.id, userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: sol.dataEncerramento },
    )
  }

  for (const aprov of cicloAprovacoes) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  for (const evt of cicloEventos) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 12 solicitações de ciclo de vida criadas (C1-C4 × 2-3, com tempos significativos entre etapas)')

  // ── Solicitações extras Ribas — 2×C2, 4×C3, 2×C4 com prazos estourados ───

  const ribasExtras = [
    // C2 × 2 — prazo estourado (prazo max 5 dias, desabilitados há mais)
    {
      id: 'seed-rrp-extra-c2-01',
      protocolo: 'SGI-20260320-RX2001',
      status: 'DESABILITADO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO' as const,
      funcaoIntertravamento: 'Trip de nível alto do tanque de licor branco',
      motivoDesabilitacao: 'Sensor fora de range, aguardando peça de reposição importada',
      medidasContingenciais: 'Medição manual a cada 30min, alarme sonoro local ativado',
      periodoInicio: daysAgo(30),
      periodoFim: daysAgo(25),
      dataEnvio: daysAgo(31),
      dataAprovacaoFinal: daysAgo(30),
      dataDesabilitacao: daysAgo(29),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(32),
    },
    {
      id: 'seed-rrp-extra-c2-02',
      protocolo: 'SGI-20260325-RX2002',
      status: 'EM_REABILITACAO',
      areaId: areaCelulose.id,
      equipamentoId: eqCel1.id,
      classeId: classe2.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO' as const,
      funcaoIntertravamento: 'Proteção térmica do motor do lavador',
      motivoDesabilitacao: 'Relé térmico com defeito, desarmando indevidamente',
      medidasContingenciais: 'Monitoramento de temperatura com pirômetro a cada 15min',
      periodoInicio: daysAgo(22),
      periodoFim: daysAgo(17),
      dataEnvio: daysAgo(23),
      dataAprovacaoFinal: daysAgo(22),
      dataDesabilitacao: daysAgo(21),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(24),
    },

    // C3 × 4 — prazo estourado (prazo max 3 dias)
    {
      id: 'seed-rrp-extra-c3-01',
      protocolo: 'SGI-20260318-RX3001',
      status: 'DESABILITADO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO' as const,
      funcaoIntertravamento: 'Alarme de pressão alta do evaporador',
      motivoDesabilitacao: 'Transmissor de pressão com drift, calibração necessária',
      medidasContingenciais: 'Manômetro local verificado a cada 20min, limite reduzido',
      periodoInicio: daysAgo(28),
      periodoFim: daysAgo(25),
      dataEnvio: daysAgo(29),
      dataAprovacaoFinal: daysAgo(28),
      dataDesabilitacao: daysAgo(27),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(30),
    },
    {
      id: 'seed-rrp-extra-c3-02',
      protocolo: 'SGI-20260322-RX3002',
      status: 'EM_EXECUCAO',
      areaId: areaCelulose.id,
      equipamentoId: eqCel2.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA' as const,
      funcaoIntertravamento: 'Trip de alta vibração do agitador do digestor',
      motivoDesabilitacao: 'Acelerômetro danificado por condensação',
      medidasContingenciais: 'Monitoramento portátil de vibração, inspeção visual contínua',
      periodoInicio: daysAgo(20),
      periodoFim: daysAgo(17),
      dataEnvio: daysAgo(21),
      dataAprovacaoFinal: daysAgo(20),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(22),
    },
    {
      id: 'seed-rrp-extra-c3-03',
      protocolo: 'SGI-20260328-RX3003',
      status: 'EM_VALIDACAO_DA_REABILITACAO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO' as const,
      funcaoIntertravamento: 'Bloqueio por detecção de gás H2S na caldeira',
      motivoDesabilitacao: 'Detector de gás em manutenção preventiva programada',
      medidasContingenciais: 'Detector portátil com operador dedicado, ventilação forçada',
      periodoInicio: daysAgo(18),
      periodoFim: daysAgo(15),
      dataEnvio: daysAgo(19),
      dataAprovacaoFinal: daysAgo(18),
      dataDesabilitacao: daysAgo(17),
      dataReabilitacao: daysAgo(12),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(20),
    },
    {
      id: 'seed-rrp-extra-c3-04',
      protocolo: 'SGI-20260401-RX3004',
      status: 'ENCERRADA',
      areaId: areaCelulose.id,
      equipamentoId: eqCel3.id,
      classeId: classe3.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'FISICO' as const,
      funcaoIntertravamento: 'Válvula de alívio do digestor — sobrepressão',
      motivoDesabilitacao: 'Vazamento pela sede, necessidade de retífica',
      medidasContingenciais: 'Pressão operacional reduzida em 20%, disco de ruptura como backup',
      periodoInicio: daysAgo(15),
      periodoFim: daysAgo(12),
      dataEnvio: daysAgo(16),
      dataAprovacaoFinal: daysAgo(15),
      dataDesabilitacao: daysAgo(14),
      dataReabilitacao: daysAgo(8),
      dataEncerramento: daysAgo(7),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(17),
    },

    // C4 × 2 — prazo estourado (prazo max 1 dia)
    {
      id: 'seed-rrp-extra-c4-01',
      protocolo: 'SGI-20260405-RX4001',
      status: 'DESABILITADO',
      areaId: areaRecuperacao.id,
      equipamentoId: eqRec1.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'LOGICO' as const,
      funcaoIntertravamento: 'ESD caldeira de recuperação — alta pressão',
      motivoDesabilitacao: 'Falha no controlador lógico, bypass necessário para continuidade',
      medidasContingenciais: 'Operador exclusivo monitorando pressão, trip manual preparado',
      periodoInicio: daysAgo(10),
      periodoFim: daysAgo(9),
      dataEnvio: daysAgo(11),
      dataAprovacaoFinal: daysAgo(10),
      dataDesabilitacao: daysAgo(9),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(12),
    },
    {
      id: 'seed-rrp-extra-c4-02',
      protocolo: 'SGI-20260408-RX4002',
      status: 'EM_REABILITACAO',
      areaId: areaCelulose.id,
      equipamentoId: eqCel1.id,
      classeId: classe4.id,
      solicitanteId: solicitante.id,
      executanteId: executante.id,
      tipo: 'DISPOSITIVO_SEGURANCA' as const,
      funcaoIntertravamento: 'Shutdown de emergência do digestor — sobretemperatura',
      motivoDesabilitacao: 'Termopar queimado, sem leitura de temperatura do topo',
      medidasContingenciais: 'Termopar portátil instalado, leitura manual a cada 10min, limite operacional reduzido',
      periodoInicio: daysAgo(7),
      periodoFim: daysAgo(6),
      dataEnvio: daysAgo(8),
      dataAprovacaoFinal: daysAgo(7),
      dataDesabilitacao: daysAgo(6),
      prazoMaximoAtingido: true,
      createdAt: daysAgo(9),
    },
  ]

  for (const sol of ribasExtras) {
    await prisma.solicitacao.upsert({
      where: { id: sol.id },
      update: {},
      create: sol,
    })
  }

  // Aprovações para extras Ribas
  const extrasAprovacoes: any[] = []
  const extrasEventos: any[] = []
  for (const sol of ribasExtras) {
    const classeNumero = sol.classeId === classe2.id ? 2 : sol.classeId === classe3.id ? 3 : 4

    extrasAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: aprovador1.id, nivel: 1, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    if (classeNumero >= 2) {
      extrasAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: aprovador2.id, nivel: 2, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    }
    if (classeNumero >= 4) {
      extrasAprovacoes.push({ solicitacaoId: sol.id, aprovadorId: gestor.id, nivel: 3, tipo: 'DESABILITACAO', status: 'APROVADO', respondidaEm: sol.dataAprovacaoFinal })
    }

    extrasEventos.push(
      { solicitacaoId: sol.id, userId: solicitante.id, acao: 'SOLICITACAO_ENVIADA', createdAt: sol.dataEnvio },
      { solicitacaoId: sol.id, userId: aprovador1.id, acao: 'APROVACAO_COMPLETA', detalhes: 'Aprovação completa — execução autorizada', createdAt: sol.dataAprovacaoFinal },
    )
    if (sol.dataDesabilitacao) {
      extrasEventos.push({ solicitacaoId: sol.id, userId: executante.id, acao: 'DESABILITACAO_CONFIRMADA', createdAt: sol.dataDesabilitacao })
    }
    if (sol.dataReabilitacao) {
      extrasEventos.push({ solicitacaoId: sol.id, userId: executante.id, acao: 'REABILITACAO_CONCLUIDA_EXECUTANTE', createdAt: sol.dataReabilitacao })
    }
    if (sol.dataEncerramento) {
      extrasEventos.push({ solicitacaoId: sol.id, userId: aprovador1.id, acao: 'REABILITACAO_VALIDADA', createdAt: sol.dataEncerramento })
    }
  }

  for (const aprov of extrasAprovacoes) {
    const existing = await prisma.aprovacao.findFirst({
      where: { solicitacaoId: aprov.solicitacaoId, aprovadorId: aprov.aprovadorId, nivel: aprov.nivel },
    })
    if (!existing) {
      await prisma.aprovacao.create({ data: aprov })
    }
  }

  for (const evt of extrasEventos) {
    const existing = await prisma.eventoAuditoria.findFirst({
      where: { solicitacaoId: evt.solicitacaoId, acao: evt.acao, userId: evt.userId },
    })
    if (!existing) {
      await prisma.eventoAuditoria.create({ data: evt })
    }
  }

  console.log('✓ 8 solicitações extras Ribas com prazos estourados (C2×2, C3×4, C4×2)')

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
