import type { Meta, StoryObj } from '@storybook/react'
import { StatusBadge } from '@/components/sgi/StatusBadge'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import type { StatusSolicitacao, ClasseNum } from '@/lib/tokens'

const meta: Meta = {
  title: 'Design System/Table',
  parameters: { layout: 'padded' },
}

export default meta

const TIPO_LABELS: Record<string, { label: string; icon: string }> = {
  LOGICO: { label: 'Lógico', icon: 'memory' },
  FISICO: { label: 'Físico', icon: 'precision_manufacturing' },
  DISPOSITIVO_SEGURANCA: { label: 'Disp. Segurança', icon: 'shield' },
}

const MOCK_DATA = [
  { protocolo: 'SGI-20260401-0012', tag: 'PSV-2201A', classe: 3, tipo: 'LOGICO', periodo: '01/04/26 → 05/04/26', atualizado: '15/04/26 às 14:30', status: 'DESABILITADO' as StatusSolicitacao, prazo: { text: 'Reabilitação atrasada 2d', color: '#DC2626' } },
  { protocolo: 'SGI-20260328-0045', tag: 'XV-3302', classe: 2, tipo: 'FISICO', periodo: '28/03/26 → 02/04/26', atualizado: '14/04/26 às 09:15', status: 'EM_APROVACAO' as StatusSolicitacao, prazo: null },
  { protocolo: 'SGI-20260415-0003', tag: 'LSH-1105', classe: 1, tipo: 'DISPOSITIVO_SEGURANCA', periodo: '15/04/26 → 20/04/26', atualizado: '15/04/26 às 16:00', status: 'EXECUCAO_AUTORIZADA' as StatusSolicitacao, prazo: null },
  { protocolo: 'SGI-20260410-0021', tag: 'PAHH-4401', classe: 4, tipo: 'LOGICO', periodo: '10/04/26 → 12/04/26', atualizado: '13/04/26 às 11:45', status: 'ENCERRADA' as StatusSolicitacao, prazo: null },
  { protocolo: 'SGI-20260412-0007', tag: 'TSH-5501B', classe: 3, tipo: 'FISICO', periodo: '12/04/26 → 16/04/26', atualizado: '15/04/26 às 08:20', status: 'DESABILITADO' as StatusSolicitacao, prazo: { text: 'Reabilitar até amanhã', color: '#D97706' } },
  { protocolo: 'SGI-20260405-0018', tag: 'XV-2205C', classe: 2, tipo: 'LOGICO', periodo: '05/04/26 → 10/04/26', atualizado: '12/04/26 às 17:00', status: 'EM_VALIDACAO_DA_REABILITACAO' as StatusSolicitacao, prazo: null },
]

const COLS = ['Protocolo', 'TAG', 'Classe', 'Tipo', 'Período', 'Atualizado em', 'Status', 'Ações']

export const TabelaSolicitacoes: StoryObj = {
  name: 'Tabela de solicitações',
  render: () => (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Tabela principal de solicitações. Header com fundo <code>#F8FAFC</code>, texto <code>#1E293B</code> (slate-800), 14px semibold.
        <br />Células 14px, cor <code>#4B5563</code>. Bordas entre linhas <code>#E5E7EB</code>. Border-radius 8px.
        <br />Indicador de prazo aparece apenas para status DESABILITADO, 12px Inter medium.
      </p>

      <div style={{ overflow: 'auto', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }}>
        <table style={{ width: '100%', minWidth: 960, borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#EEF2F8', borderBottom: '1px solid #E2E8F0' }}>
              {COLS.map(col => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1E293B',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col}
                  {col !== 'Ações' && (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13, marginLeft: 4, color: '#CBD5E1', verticalAlign: 'middle' }}
                    >
                      arrow_upward
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DATA.map((row, i) => {
              const tipoInfo = TIPO_LABELS[row.tipo]
              return (
                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                  <td style={{ padding: '14px 16px', color: '#1F2937', whiteSpace: 'nowrap' }}>
                    #{row.protocolo}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {row.tag}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <ClasseBadge classe={row.classe as ClasseNum} size="sm" />
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                    {tipoInfo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748B', lineHeight: 1 }}>{tipoInfo.icon}</span>
                        {tipoInfo.label}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ color: '#4B5563' }}>{row.periodo}</div>
                    {row.prazo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: row.prazo.color, marginTop: 4, lineHeight: 1.2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.prazo.color, flexShrink: 0 }} />
                        {row.prazo.text}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                    {row.atualizado}
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#0038A8', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Ver →</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  ),
}
