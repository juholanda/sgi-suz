'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

interface UserData {
  id: string
  nome: string
  email: string
  matricula: string
  cargo: { nome: string } | null
  perfis: { perfil: string; plantaId: string | null }[]
}

interface Props {
  user: UserData
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

type Tab = 'conta' | 'seguranca' | 'notificacoes'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'conta',        label: 'Conta',        icon: 'person' },
  { id: 'seguranca',    label: 'Segurança',    icon: 'lock' },
  { id: 'notificacoes', label: 'Notificações', icon: 'notifications' },
]

const PERFIL_LABELS: Record<string, string> = {
  SOLICITANTE:   'Solicitante',
  EXECUTANTE:    'Executante',
  APROVADOR:     'Aprovador',
  GESTOR_SMS:    'Gestor SMS',
  ADMINISTRADOR: 'Administrador',
}

export default function PerfilClient({ user }: Props) {
  const [tab, setTab] = useState<Tab>('conta')

  // Conta
  const [nome, setNome] = useState(user.nome)
  const [savingConta, setSavingConta] = useState(false)
  const [savedConta, setSavedConta] = useState(false)

  // Segurança
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [savingSenha, setSavingSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [savedSenha, setSavedSenha] = useState(false)

  // Notificações
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifAprovacao, setNotifAprovacao] = useState(true)
  const [notifPrazo, setNotifPrazo] = useState(true)
  const [notifReabilitacao, setNotifReabilitacao] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)
  const [savedNotif, setSavedNotif] = useState(false)

  async function handleSalvarConta(e: React.FormEvent) {
    e.preventDefault()
    setSavingConta(true)
    await new Promise(r => setTimeout(r, 700))
    setSavedConta(true)
    setSavingConta(false)
    setTimeout(() => setSavedConta(false), 3000)
  }

  async function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha('')
    if (novaSenha.length < 8) { setErroSenha('Mínimo de 8 caracteres.'); return }
    if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não coincidem.'); return }
    setSavingSenha(true)
    await new Promise(r => setTimeout(r, 700))
    setSavedSenha(true)
    setSavingSenha(false)
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('')
    setTimeout(() => setSavedSenha(false), 3000)
  }

  async function handleSalvarNotif(e: React.FormEvent) {
    e.preventDefault()
    setSavingNotif(true)
    await new Promise(r => setTimeout(r, 500))
    setSavedNotif(true)
    setSavingNotif(false)
    setTimeout(() => setSavedNotif(false), 3000)
  }

  const initials = user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className="w-16 h-16 flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ background: '#0038A8', borderRadius: '50%' }}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight" style={{ color: '#0F172A' }}>{user.nome}</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>{user.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {user.cargo && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#475569' }}>
                {user.cargo.nome}
              </span>
            )}
            {user.perfis.map(p => (
              <span key={p.perfil} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EBF0FB', color: '#0038A8' }}>
                {PERFIL_LABELS[p.perfil] ?? p.perfil}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg"
        style={{ background: 'white', border: '1px solid #E2E8F0', width: 'fit-content' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors"
            style={{
              background: tab === t.id ? '#EBF0FB' : 'transparent',
              color: tab === t.id ? '#0038A8' : '#64748B',
              fontWeight: tab === t.id ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Conta ─────────────────────────────────────────────── */}
      {tab === 'conta' && (
        <form onSubmit={handleSalvarConta}>
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E2E8F0' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: '#0F172A' }}>Informações da conta</h2>
            <div className="space-y-4">
              <Field label="Nome completo">
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="field-input"
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="E-mail" hint="Gerenciado pelo administrador.">
                <input value={user.email} disabled className="field-input" style={{ background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} />
              </Field>
              <Field label="Matrícula">
                <input value={user.matricula} disabled className="field-input" style={{ background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} />
              </Field>
              {user.cargo && (
                <Field label="Cargo">
                  <input value={user.cargo.nome} disabled className="field-input" style={{ background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} />
                </Field>
              )}
            </div>
            <SaveRow saving={savingConta} saved={savedConta} label="Salvar alterações" icon="save" />
          </div>
        </form>
      )}

      {/* ── Segurança ──────────────────────────────────────────── */}
      {tab === 'seguranca' && (
        <form onSubmit={handleSalvarSenha}>
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E2E8F0' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: '#0F172A' }}>Alterar senha</h2>
            <div className="space-y-4">
              <Field label="Senha atual">
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required className="field-input" placeholder="••••••••" />
              </Field>
              <Field label="Nova senha">
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required className="field-input" placeholder="Mínimo 8 caracteres" />
              </Field>
              <Field label="Confirmar nova senha" error={erroSenha}>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  required
                  className={`field-input${erroSenha ? ' field-input--error' : ''}`}
                  placeholder="••••••••"
                />
              </Field>
            </div>
            <SaveRow saving={savingSenha} saved={savedSenha} label="Alterar senha" icon="lock_reset" />
          </div>
        </form>
      )}

      {/* ── Notificações ───────────────────────────────────────── */}
      {tab === 'notificacoes' && (
        <form onSubmit={handleSalvarNotif}>
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E2E8F0' }}>
            <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>Preferências de notificação</h2>
            <p className="text-xs mb-5" style={{ color: '#94A3B8' }}>Escolha quais eventos geram notificação para você.</p>
            <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
              {([
                { key: 'email',        label: 'Notificações por e-mail',       desc: 'Receber resumo diário por e-mail',                           val: notifEmail,        set: setNotifEmail },
                { key: 'aprovacao',    label: 'Aprovações pendentes',           desc: 'Alertar quando uma solicitação aguarda sua aprovação',       val: notifAprovacao,    set: setNotifAprovacao },
                { key: 'prazo',        label: 'Prazo se aproximando',           desc: 'Alertar 24h antes do prazo máximo de uma desabilitação',     val: notifPrazo,        set: setNotifPrazo },
                { key: 'reabilitacao', label: 'Solicitações em reabilitação',   desc: 'Notificar quando o equipamento entrar em reabilitação',      val: notifReabilitacao, set: setNotifReabilitacao },
              ] as const).map(item => (
                <div key={item.key} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.set(!item.val)}
                    className="shrink-0 w-10 h-6 rounded-full relative transition-colors"
                    style={{ background: item.val ? '#0038A8' : '#E2E8F0', border: 'none', cursor: 'pointer' }}
                    aria-pressed={item.val}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: item.val ? '18px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
            <SaveRow saving={savingNotif} saved={savedNotif} label="Salvar preferências" icon="save" />
          </div>
        </form>
      )}

      {/* Logout */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer' }}
        >
          <Icon name="logout" size={16} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error-msg">
          <span className="material-symbols-outlined select-none" style={{ fontSize: 13, lineHeight: 1 }} aria-hidden="true">error</span>
          {error}
        </p>
      )}
    </div>
  )
}

function SaveRow({ saving, saved, label, icon }: { saving: boolean; saved: boolean; label: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
        style={{ background: saving ? '#93C5FD' : '#0038A8', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>{saving ? 'hourglass_empty' : icon}</span>
        {saving ? 'Salvando...' : label}
      </button>
      {saved && (
        <span className="flex items-center gap-1 text-sm" style={{ color: '#16A34A' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>check_circle</span>
          Salvo com sucesso
        </span>
      )}
    </div>
  )
}
