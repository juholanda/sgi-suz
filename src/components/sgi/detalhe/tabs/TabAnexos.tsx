'use client'

import type { AnexoDetalhe } from '../types'

const MIME_ICONS: Record<string, string> = {
  'application/pdf': 'picture_as_pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/gif': 'image',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
  'application/vnd.ms-excel': 'table_chart',
  'text/csv': 'table_chart',
}

function getIcon(mimeType: string | null): string {
  if (!mimeType) return 'description'
  return MIME_ICONS[mimeType] ?? 'description'
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface TabAnexosProps {
  anexos: AnexoDetalhe[]
}

export default function TabAnexos({ anexos }: TabAnexosProps) {
  if (anexos.length === 0) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: '#CBD5E1', display: 'block', marginBottom: 12 }}
        >
          attach_file
        </span>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', margin: 0 }}>
          Nenhum anexo nesta solicitacao.
        </p>
        <p style={{ fontSize: 12, color: '#CBD5E1', margin: '4px 0 0' }}>
          Anexos adicionados durante o processo aparecerao aqui.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid #F1F5F9',
          background: '#F8FAFC',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#475569', lineHeight: 1 }}>
          attach_file
        </span>
        <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: 0 }}>
          Anexos ({anexos.length})
        </h3>
      </div>

      <div>
        {anexos.map((anexo, i) => {
          const nome = anexo.nome ?? anexo.filename ?? 'Arquivo'
          const size = formatSize(anexo.tamanho)
          const icon = getIcon(anexo.mimeType)

          return (
            <div
              key={anexo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < anexos.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F1F5F9',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#475569', lineHeight: 1 }}>
                  {icon}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0F172A',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nome}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
                  {[anexo.tipo ?? anexo.mimeType, size].filter(Boolean).join(' \u00B7 ')}
                </p>
              </div>

              {anexo.url && (
                <a
                  href={anexo.url}
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    background: '#EBF0FB',
                    color: '#0038A8',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>download</span>
                  Baixar
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
