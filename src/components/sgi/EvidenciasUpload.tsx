'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Anexo {
  id: string
  nome: string
  tamanho: number
  mimeType: string
  createdAt: string
  url: string
}

interface Props {
  solicitacaoId: string
  anexos: Anexo[]
  readonly?: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EvidenciasUpload({ solicitacaoId, anexos: initialAnexos, readonly = false }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [anexos, setAnexos] = useState<Anexo[]>(initialAnexos)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  async function uploadFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      setErro('Tipo de arquivo não permitido. Use imagens (jpg, png, webp) ou PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande. Tamanho máximo: 10MB.')
      return
    }

    setErro(null)
    setUploading(true)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // strip data:...;base64, prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/anexos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: file.name, tipo: file.type, base64 }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? 'Erro ao fazer upload.')
        return
      }

      const novoAnexo = await res.json()
      setAnexos(prev => [novoAnexo, ...prev])
      router.refresh()
    } catch {
      setErro('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [solicitacaoId])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  const mimeIcon = (mime: string) => {
    if (mime.startsWith('image/')) return '🖼'
    if (mime === 'application/pdf') return '📄'
    return '📎'
  }

  return (
    <div className="bg-white border p-4 mb-4" style={{ borderColor: '#E2E8F0', borderRadius: '4px' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
        Evidências
      </h3>

      {!readonly && (
        <>
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors mb-3"
            style={{
              borderColor: dragOver ? '#0038A8' : '#CBD5E1',
              background: dragOver ? '#EBF0FB' : '#F8FAFC',
              borderRadius: '4px',
            }}
          >
            <div className="text-2xl mb-2">{uploading ? '⏳' : '📁'}</div>
            {uploading ? (
              <p className="text-sm" style={{ color: '#0038A8' }}>Enviando...</p>
            ) : (
              <>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  Arraste arquivos aqui ou{' '}
                  <span style={{ color: '#0038A8' }}>selecione</span>
                </p>
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                  JPG, PNG, WEBP ou PDF · Máx. 10MB por arquivo
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          {erro && (
            <div className="mb-3 px-3 py-2 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: '4px' }}>
              {erro}
            </div>
          )}
        </>
      )}

      {/* Lista de anexos */}
      {anexos.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: '#94A3B8' }}>
          {readonly ? 'Nenhuma evidência enviada.' : 'Nenhum arquivo enviado ainda.'}
        </p>
      ) : (
        <div className="space-y-2">
          {anexos.map(a => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3"
              style={{ background: '#F8FAFC', borderRadius: '4px' }}
            >
              <span className="text-xl shrink-0">{mimeIcon(a.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>{a.nome}</p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>
                  {formatBytes(a.tamanho)} · {formatDate(a.createdAt)}
                </p>
              </div>
              <a
                href={a.url.startsWith('local:/') ? '#' : a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 text-xs border transition-colors"
                style={{ borderColor: '#E2E8F0', borderRadius: '4px', color: '#475569' }}
                title="Baixar"
              >
                ⬇ Baixar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
