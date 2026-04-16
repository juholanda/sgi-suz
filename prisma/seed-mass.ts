/**
 * Seed massivo — 45 solicitações nos últimos 45 dias (1/dia)
 * Classes variadas, prazos estourados e dentro do prazo, status realistas.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

const TIPOS = ['LOGICO', 'FISICO', 'DISPOSITIVO_SEGURANCA'] as const

const FUNCOES = [
  'Proteção contra sobrepressão do vaso',
  'Shutdown de emergência do digestor',
  'Proteção térmica do motor principal',
  'Intertravamento de nível alto do tanque',
  'Proteção contra sobrevelocidade da turbina',
  'Detector de chama da caldeira',
  'Válvula de alívio de pressão',
  'Sensor de vibração do compressor',
  'Intertravamento de porta de acesso',
  'Proteção de sobrecorrente do transformador',
  'Detector de gás na sala de controle',
  'Chave de emergência da esteira',
  'Proteção contra refluxo na tubulação',
  'Sensor de temperatura do forno',
  'Intertravamento de segurança do evaporador',
  'Proteção de nível baixo da bomba',
  'Válvula de bloqueio automático',
  'Sistema de detecção de vazamento',
  'Proteção contra cavitação da bomba',
  'Intertravamento de sequência de partida',
]

const MOTIVOS = [
  'Manutenção preventiva programada',
  'Substituição de sensor defeituoso',
  'Calibração do transmissor de pressão',
  'Reparo no módulo de entrada do CLP',
  'Troca de relé térmico queimado',
  'Atualização de firmware do controlador',
  'Inspeção visual e teste funcional',
  'Substituição de cabo de sinal danificado',
  'Reparo na válvula solenóide',
  'Limpeza e verificação do detector',
  'Troca de componente eletrônico',
  'Ajuste de setpoint conforme novo parâmetro',
  'Teste de aceitação pós-manutenção',
  'Reparo emergencial por falha intermitente',
  'Substituição de elemento sensor',
]

const MEDIDAS = [
  'Monitoramento manual a cada 2h, operador de plantão na área',
  'Inspeção visual periódica, redução de carga para 70%',
  'Ronda a cada 1h, supervisor notificado, plano de contingência ativo',
  'Operação em modo manual com acompanhamento contínuo',
  'Redução de velocidade, monitoramento de vibração manual',
  'Bypass com alarme visual na sala de controle',
  'Ronda operacional intensificada, sinalização de área',
  'Operador dedicado ao monitoramento, comunicação via rádio',
]

async function main() {
  console.log('=== Seed massivo — 45 dias de solicitações ===\n')

  // ── Buscar dados existentes ──
  const classes = await prisma.classe.findMany({ where: { ativa: true, numero: { lte: 4 } }, orderBy: { numero: 'asc' } })
  const areas = await prisma.area.findMany({ include: { planta: true, equipamentos: { take: 10 } } })
  const users = await prisma.user.findMany({ select: { id: true, nome: true, matricula: true } })

  const solicitante = users.find(u => u.matricula === '000002')!
  const executante = users.find(u => u.matricula === '000003')!
  const aprovador1 = users.find(u => u.matricula === '000004')!
  const aprovador2 = users.find(u => u.matricula === '000005')!
  const gestor = users.find(u => u.matricula === '000006')!

  console.log(`Classes: ${classes.map(c => `CL${c.numero}`).join(', ')}`)
  console.log(`Áreas: ${areas.map(a => `${a.planta.nome}/${a.nome} (${a.equipamentos.length} equips)`).join(', ')}`)
  console.log(`Users: ${users.map(u => u.nome).join(', ')}\n`)

  // Flatten equipment per area
  const areasWithEquips = areas.filter(a => a.equipamentos.length > 0)
  if (areasWithEquips.length === 0) {
    console.error('Nenhuma área com equipamentos encontrada!')
    return
  }

  // ── Gerar solicitações ──
  const DAYS = 45
  const PER_DAY = 1
  let counter = 0
  let created = 0
  let skipped = 0

  // Prazo máximo por classe
  const prazoMax: Record<number, number> = {}
  for (const c of classes) {
    prazoMax[c.numero] = c.prazoMaximoDias ?? 7
  }

  for (let day = DAYS; day >= 1; day--) {
    for (let i = 0; i < PER_DAY; i++) {
      counter++
      const solId = `mass-sol-${String(counter).padStart(4, '0')}`
      const protocolo = `SGI-MASS-${String(counter).padStart(4, '0')}`

      // Pick random class (weighted: more CL2/CL3)
      const classe = pickWeighted(classes, [15, 35, 35, 15])
      const area = pick(areasWithEquips)
      const equip = pick(area.equipamentos)
      const tipo = pick([...TIPOS])
      const prazoMaxDias = prazoMax[classe.numero]

      // Timeline
      const createdAt = daysAgo(day)
      const dataEnvio = addDays(createdAt, 0)
      const periodoInicio = addDays(createdAt, 1)

      // Prazo: some within, some exceeded
      const excedePrazo = Math.random() < 0.3 // 30% excedem prazo
      const duracaoReal = excedePrazo
        ? prazoMaxDias + 1 + Math.floor(Math.random() * 5)
        : Math.max(1, Math.floor(Math.random() * prazoMaxDias))
      const periodoFim = addDays(periodoInicio, duracaoReal)

      // Determine status based on age
      let status: string
      let dataAprovacaoFinal: Date | null = null
      let dataDesabilitacao: Date | null = null
      let dataReabilitacao: Date | null = null
      let dataEncerramento: Date | null = null
      const prazoMaximoAtingido = excedePrazo

      const ageDays = day // how many days ago
      const now = new Date()

      if (ageDays > 20) {
        // Old ones: mostly ENCERRADA or CANCELADA
        const r = Math.random()
        if (r < 0.75) {
          status = 'ENCERRADA'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
          dataReabilitacao = addDays(dataDesabilitacao, duracaoReal)
          dataEncerramento = addDays(dataReabilitacao, 1)
        } else if (r < 0.85) {
          status = 'CANCELADA'
        } else if (r < 0.92) {
          status = 'REJEITADA'
        } else {
          status = 'DESABILITADO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
        }
      } else if (ageDays > 10) {
        // Middle age: mix of active statuses
        const r = Math.random()
        if (r < 0.3) {
          status = 'ENCERRADA'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
          dataReabilitacao = addDays(dataDesabilitacao, duracaoReal)
          dataEncerramento = addDays(dataReabilitacao, 1)
        } else if (r < 0.5) {
          status = 'DESABILITADO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
        } else if (r < 0.65) {
          status = 'EM_REABILITACAO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
        } else if (r < 0.8) {
          status = 'EM_VALIDACAO_DA_REABILITACAO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
          dataReabilitacao = addDays(dataDesabilitacao, duracaoReal)
        } else {
          status = 'EM_EXECUCAO'
          dataAprovacaoFinal = addDays(createdAt, 1)
        }
      } else {
        // Recent: lots of in-progress
        const r = Math.random()
        if (r < 0.25) status = 'EM_APROVACAO'
        else if (r < 0.45) {
          status = 'EXECUCAO_AUTORIZADA'
          dataAprovacaoFinal = addDays(createdAt, 1)
        } else if (r < 0.6) {
          status = 'EM_EXECUCAO'
          dataAprovacaoFinal = addDays(createdAt, 1)
        } else if (r < 0.75) {
          status = 'DESABILITADO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
        } else if (r < 0.85) {
          status = 'RASCUNHO'
        } else {
          status = 'EM_REABILITACAO'
          dataAprovacaoFinal = addDays(createdAt, 1)
          dataDesabilitacao = addDays(dataAprovacaoFinal, 1)
        }
      }

      // Don't set future dates
      if (dataEncerramento && dataEncerramento > now) {
        status = 'EM_VALIDACAO_DA_REABILITACAO'
        dataEncerramento = null
      }
      if (dataReabilitacao && dataReabilitacao > now && status === 'ENCERRADA') {
        status = 'DESABILITADO'
        dataReabilitacao = null
        dataEncerramento = null
      }

      // Create solicitação
      try {
        await prisma.solicitacao.upsert({
          where: { id: solId },
          update: {},
          create: {
            id: solId,
            protocolo,
            status,
            areaId: area.id,
            equipamentoId: equip.id,
            classeId: classe.id,
            solicitanteId: solicitante.id,
            executanteId: executante.id,
            tipo,
            funcaoIntertravamento: pick(FUNCOES),
            motivoDesabilitacao: pick(MOTIVOS),
            medidasContingenciais: pick(MEDIDAS),
            periodoInicio,
            periodoFim,
            duracaoPrevistaDias: duracaoReal,
            dataEnvio: status !== 'RASCUNHO' ? dataEnvio : null,
            dataAprovacaoFinal,
            dataDesabilitacao,
            dataReabilitacao,
            dataEncerramento,
            prazoMaximoAtingido,
            prazoPrevitoAtingido: excedePrazo && Math.random() < 0.5,
            createdAt,
            updatedAt: dataEncerramento ?? dataReabilitacao ?? dataDesabilitacao ?? dataAprovacaoFinal ?? createdAt,
          },
        })

        // ── Aprovações ──
        const needsApproval = status !== 'RASCUNHO'
        if (needsApproval) {
          const aprovadoStatuses = ['EXECUCAO_AUTORIZADA', 'EM_EXECUCAO', 'DESABILITADO', 'EM_REABILITACAO', 'EM_VALIDACAO_DA_REABILITACAO', 'ENCERRADA']
          const isAprovado = aprovadoStatuses.includes(status)
          const isRejeitado = status === 'REJEITADA'

          // Level 1 always
          await prisma.aprovacao.create({
            data: {
              solicitacaoId: solId,
              aprovadorId: aprovador1.id,
              nivel: 1,
              tipo: 'DESABILITACAO',
              status: isRejeitado ? 'REJEITADO' : (isAprovado || status === 'CANCELADA' ? 'APROVADO' : 'PENDENTE'),
              respondidaEm: (isAprovado || isRejeitado || status === 'CANCELADA') ? addDays(createdAt, 1) : null,
              motivoRejeicao: isRejeitado ? 'Justificativa insuficiente para desabilitar este intertravamento.' : null,
            },
          })

          // Level 2 for CL2+
          if (classe.numero >= 2) {
            const l2Approved = isAprovado && !isRejeitado
            await prisma.aprovacao.create({
              data: {
                solicitacaoId: solId,
                aprovadorId: aprovador2.id,
                nivel: 2,
                tipo: 'DESABILITACAO',
                status: isRejeitado ? 'REJEITADO' : (l2Approved ? 'APROVADO' : (status === 'EM_APROVACAO' ? 'AGUARDANDO' : 'PENDENTE')),
                respondidaEm: l2Approved ? addDays(createdAt, 1) : null,
              },
            })
          }

          // Level 3 for CL4
          if (classe.numero >= 4) {
            const l3Approved = isAprovado && !isRejeitado
            await prisma.aprovacao.create({
              data: {
                solicitacaoId: solId,
                aprovadorId: gestor.id,
                nivel: 3,
                tipo: 'DESABILITACAO',
                status: l3Approved ? 'APROVADO' : 'AGUARDANDO',
                respondidaEm: l3Approved ? addDays(createdAt, 1) : null,
              },
            })
          }
        }

        // ── Eventos mínimos ──
        // Criação
        await prisma.eventoAuditoria.create({
          data: {
            solicitacaoId: solId,
            userId: solicitante.id,
            acao: 'RASCUNHO_CRIADO',
            createdAt,
          },
        })

        if (status !== 'RASCUNHO') {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: solicitante.id,
              acao: 'SOLICITACAO_ENVIADA',
              createdAt: dataEnvio,
            },
          })
        }

        if (dataAprovacaoFinal) {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: aprovador1.id,
              acao: 'APROVACAO_COMPLETA',
              detalhes: 'Todos os níveis aprovados — execução autorizada',
              createdAt: dataAprovacaoFinal,
            },
          })
        }

        if (status === 'REJEITADA') {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: aprovador1.id,
              acao: 'REJEICAO_REGISTRADA',
              detalhes: 'Justificativa insuficiente',
              createdAt: addDays(createdAt, 1),
            },
          })
        }

        if (dataDesabilitacao) {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: executante.id,
              acao: 'DESABILITACAO_CONFIRMADA',
              detalhes: 'Checklist de desabilitação preenchido',
              createdAt: dataDesabilitacao,
            },
          })
        }

        if (dataReabilitacao) {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: executante.id,
              acao: 'REABILITACAO_CONCLUIDA',
              detalhes: 'Checklist de reabilitação preenchido',
              createdAt: dataReabilitacao,
            },
          })
        }

        if (dataEncerramento) {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: aprovador1.id,
              acao: 'REABILITACAO_VALIDADA',
              createdAt: dataEncerramento,
            },
          })
        }

        if (status === 'CANCELADA') {
          await prisma.eventoAuditoria.create({
            data: {
              solicitacaoId: solId,
              userId: solicitante.id,
              acao: 'CANCELADA',
              detalhes: 'Cancelada pelo solicitante',
              createdAt: addDays(createdAt, 2),
            },
          })
        }

        created++
      } catch (e: any) {
        if (e.code === 'P2002') {
          skipped++
        } else {
          console.error(`Erro em ${solId}:`, e.message)
        }
      }
    }

    if (day % 10 === 0) {
      process.stdout.write(`  Dia -${day}: ${created} criadas...\n`)
    }
  }

  console.log(`\n✓ ${created} solicitações criadas, ${skipped} já existiam`)

  // Stats
  const stats = await prisma.solicitacao.groupBy({
    by: ['status'],
    _count: true,
    where: { id: { startsWith: 'mass-sol-' } },
  })
  console.log('\nDistribuição por status:')
  for (const s of stats.sort((a, b) => b._count - a._count)) {
    console.log(`  ${s.status}: ${s._count}`)
  }

  const classStats = await prisma.$queryRaw<Array<{numero: number, count: bigint}>>`
    SELECT c.numero, COUNT(*) as count
    FROM "Solicitacao" s
    JOIN "Classe" c ON s."classeId" = c.id
    WHERE s.id LIKE 'mass-sol-%'
    GROUP BY c.numero
    ORDER BY c.numero
  `
  console.log('\nDistribuição por classe:')
  for (const s of classStats) {
    console.log(`  CL${s.numero}: ${s.count}`)
  }

  const prazoStats = await prisma.solicitacao.count({
    where: { id: { startsWith: 'mass-sol-' }, prazoMaximoAtingido: true },
  })
  console.log(`\nPrazos estourados: ${prazoStats}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
