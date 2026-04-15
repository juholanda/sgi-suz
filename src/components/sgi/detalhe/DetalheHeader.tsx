'use client'

import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import type { StatusSolicitacao, ClasseNum } from '@/lib/tokens'
import WorkflowStepper from './WorkflowStepper'
import AlertaBanner from './AlertaBanner'
import type { SolicitacaoDetalhe } from './types'

const TIPO_LABELS: Record<string, string> = {
  LOGICO: 'Lógico',
  FISICO: 'Físico',
  DISPOSITIVO_SEGURANCA: 'Disp. Segurança',
}

interface DetalheHeaderProps {
  s: SolicitacaoDetalhe
}

export default function DetalheHeader({ s }: DetalheHeaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* TAG + badges row */}
      <div>
        <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {s.equipamento.tag}
          </h1>
          <StatusBadge status={s.status as StatusSolicitacao} />
          {s.classe && <ClasseBadge classe={s.classe.numero as ClasseNum} showPrazo />}
        </div>

        {/* Subtitle: Protocolo · Planta > Área · Tipo */}
        <div
          className="flex flex-wrap items-center gap-2"
          style={{ fontSize: 13, color: '#475569' }}
        >
          <span style={{ fontWeight: 500, color: '#0038A8' }}>#{s.protocolo}</span>
          <span style={{ color: '#CBD5E1' }}>{'\u00B7'}</span>
          <span>{s.area.planta.nome} {'\u203A'} {s.area.nome}</span>
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
