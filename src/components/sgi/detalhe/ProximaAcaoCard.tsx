'use client'

interface Aprovacao {
  nivel: number
  status: string
  aprovador: { nome: string }
}

interface ProximaAcaoCardProps {
  status: string
  solicitante: { nome: string }
  executante: { nome: string } | null
  aprovacoes: Aprovacao[]
}

interface AcaoInfo {
  texto: string
  responsavel: string | null
  icon: string
}

function resolveAcao(props: ProximaAcaoCardProps): AcaoInfo {
  const { status, solicitante, executante, aprovacoes } = props

  switch (status) {
    case 'RASCUNHO':
      return {
        texto: 'Complete e envie para aprovacao',
        responsavel: solicitante.nome,
        icon: 'arrow_forward',
      }

    case 'EM_APROVACAO': {
      const pendente = aprovacoes.find((a) => a.status === 'PENDENTE')
      if (pendente) {
        return {
          texto: `Aprovacao nivel ${pendente.nivel} pendente`,
          responsavel: pendente.aprovador.nome,
          icon: 'person',
        }
      }
      return {
        texto: 'Aprovacao pendente',
        responsavel: null,
        icon: 'person',
      }
    }

    case 'EXECUCAO_AUTORIZADA':
      return {
        texto: 'Aguardando inicio da execucao',
        responsavel: executante?.nome ?? solicitante.nome,
        icon: 'arrow_forward',
      }

    case 'EM_EXECUCAO':
      return {
        texto: 'Execucao de campo em andamento',
        responsavel: executante?.nome ?? null,
        icon: 'engineering',
      }

    case 'DESABILITADO':
      return {
        texto: 'Intertravamento desabilitado — aguardando reabilitacao',
        responsavel: executante?.nome ?? null,
        icon: 'lock_open',
      }

    case 'EM_REABILITACAO':
      return {
        texto: 'Reabilitacao em andamento',
        responsavel: executante?.nome ?? null,
        icon: 'replay',
      }

    case 'EM_VALIDACAO_DA_REABILITACAO': {
      const ultimo = aprovacoes.length > 0
        ? aprovacoes.reduce((prev, curr) =>
            curr.nivel > prev.nivel ? curr : prev
          )
        : null
      return {
        texto: 'Aguardando validacao final',
        responsavel: ultimo?.aprovador.nome ?? null,
        icon: 'verified',
      }
    }

    case 'EXTENSAO_EM_ANALISE': {
      const aprovador = aprovacoes.find((a) => a.status === 'PENDENTE')
      return {
        texto: 'Extensao de prazo em analise',
        responsavel: aprovador?.aprovador.nome ?? null,
        icon: 'schedule',
      }
    }

    case 'ENCERRADA':
      return {
        texto: 'Solicitacao encerrada',
        responsavel: null,
        icon: 'check_circle',
      }

    case 'REJEITADA':
      return {
        texto: 'Solicitacao rejeitada',
        responsavel: null,
        icon: 'cancel',
      }

    case 'CANCELADA':
      return {
        texto: 'Solicitacao cancelada',
        responsavel: null,
        icon: 'block',
      }

    default:
      return {
        texto: 'Status desconhecido',
        responsavel: null,
        icon: 'help',
      }
  }
}

export default function ProximaAcaoCard(props: ProximaAcaoCardProps) {
  const acao = resolveAcao(props)

  return (
    <div
      style={{
        backgroundColor: '#EBF0FB',
        borderLeft: '3px solid #0038A8',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 18,
          color: '#0038A8',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {acao.icon}
      </span>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#0F172A',
            lineHeight: 1.4,
          }}
        >
          Proxima acao: {acao.texto}
        </div>

        {acao.responsavel && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#475569',
              lineHeight: 1.4,
              marginTop: 2,
            }}
          >
            Responsavel: {acao.responsavel}
          </div>
        )}
      </div>
    </div>
  )
}
