'use client'

import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import type { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import WorkflowStepper from './WorkflowStepper'
import PrazoCard from './PrazoCard'
import AlertaBanner from './AlertaBanner'
import type { SolicitacaoDetalhe } from './types'

const TIPO_LABELS: Record<string, string> = {
  LOGICO: 'Logico',
  FISICO: 'Fisico',
  DISPOSITIVO_SEGURANCA: 'Disp. Seguranca',
}

interface DetalheHeaderProps {
  s: SolicitacaoDetalhe
}

export default function DetalheHeader({ s }: DetalheHeaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Protocol + badges row */}
      <div>
        <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#0F172A',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {s.protocolo}
          </h1>
          <StatusBadge status={s.status as StatusSolicitacao} />
          {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} showPrazo />}
        </div>

        {/* Subtitle: Planta > Area | TAG | Tipo */}
        <div
          className="flex flex-wrap items-center gap-2"
          style={{ fontSize: 13, color: '#475569' }}
        >
          <span>{s.area.planta.nome} {'\u203A'} {s.area.nome}</span>
          <span style={{ color: '#CBD5E1' }}>{'\u00B7'}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0038A8' }}>{s.equipamento.tag}</span>
          {s.tipo && (
            <>
              <span style={{ color: '#CBD5E1' }}>{'\u00B7'}</span>
              <span>{TIPO_LABELS[s.tipo] ?? s.tipo}</span>
            </>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '8px 16px',
        }}
      >
        <WorkflowStepper status={s.status} />
      </div>

      {/* Prazo card */}
      <PrazoCard
        status={s.status}
        periodoInicio={s.periodoInicio}
        periodoFim={s.periodoFim}
        dataEnvio={s.dataEnvioAprovacao}
        dataDesabilitacao={s.dataDesabilitacao}
        dataAprovacaoFinal={null}
        prazoMaximoDias={s.classe?.prazoMaximoDias ?? null}
        prazoPrevitoAtingido={s.prazoPrevitoAtingido}
        prazoMaximoAtingido={s.prazoMaximoAtingido}
        createdAt={s.createdAt}
      />

      {/* Alert banners */}
      <AlertaBanner
        prazoMaximoAtingido={s.prazoMaximoAtingido}
        prazoPrevitoAtingido={s.prazoPrevitoAtingido}
        classeNumero={s.classe?.numero ?? null}
        status={s.status}
      />

    </div>
  )
}
