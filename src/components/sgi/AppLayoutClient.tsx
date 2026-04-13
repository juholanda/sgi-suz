'use client'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import MobileHeader from './MobileHeader'
import type { NotifItem } from '@/app/api/notificacoes/route'

export interface Perfil {
  perfil: string
  plantaId: string | null
  areaId: string | null
}

export interface Planta {
  id: string
  nome: string
}

interface Props {
  children: React.ReactNode
  user: { name?: string | null; email?: string | null }
  perfisReais: Perfil[]
  plantas: Planta[]
}

export default function AppLayoutClient({ children, user, perfisReais, plantas }: Props) {
  const [perfilAtivo, setPerfilAtivo] = useState<string>('')
  const [plantaAtiva, setPlantaAtiva] = useState<string>('')
  const [notifCount, setNotifCount] = useState(0)
  const [notifItems, setNotifItems] = useState<NotifItem[]>([])
  const [showNotif, setShowNotif] = useState(false)

  // Inicializar perfil ativo do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sgi_demo_perfil')
    if (stored && perfisReais.some(p => p.perfil === stored)) {
      setPerfilAtivo(stored)
    } else if (perfisReais.length > 0) {
      setPerfilAtivo(perfisReais[0].perfil)
    }
  }, [perfisReais])

  // Inicializar planta ativa do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sgi_demo_planta')
    if (stored && plantas.some(p => p.id === stored)) {
      setPlantaAtiva(stored)
    } else {
      // Pegar primeira plantaId dos perfis ou primeira planta
      const firstPlantaId = perfisReais.find(p => p.plantaId)?.plantaId
      if (firstPlantaId && plantas.some(p => p.id === firstPlantaId)) {
        setPlantaAtiva(firstPlantaId)
      } else if (plantas.length > 0) {
        setPlantaAtiva(plantas[0].id)
      }
    }
  }, [perfisReais, plantas])

  // Buscar notificações quando o perfil muda
  const fetchNotificacoes = useCallback(async (perfil: string) => {
    if (!perfil) return
    try {
      const res = await fetch(`/api/notificacoes?perfil=${encodeURIComponent(perfil)}`)
      if (res.ok) {
        const data = await res.json()
        setNotifCount(data.count ?? 0)
        setNotifItems(data.items ?? [])
      }
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    if (perfilAtivo) {
      fetchNotificacoes(perfilAtivo)
    }
  }, [perfilAtivo, fetchNotificacoes])

  function switchPerfil(perfil: string) {
    localStorage.setItem('sgi_demo_perfil', perfil)
    window.location.reload()
  }

  function switchPlanta(plantaId: string) {
    localStorage.setItem('sgi_demo_planta', plantaId)
    window.location.reload()
  }

  const isAprovador = perfilAtivo === 'APROVADOR' || perfilAtivo === 'GESTOR_SMS' || perfilAtivo === 'ADMINISTRADOR'
  const isSolicitante = perfilAtivo === 'SOLICITANTE' || perfilAtivo === 'EXECUTANTE' || perfilAtivo === 'ADMINISTRADOR'

  return (
    <div className="flex min-h-screen" style={{ background: '#F0F4F8' }}>
      {/* Desktop sidebar — sticky */}
      <div className="hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
        <Sidebar
          user={user}
          perfil={perfilAtivo}
          perfisReais={perfisReais}
          planta={plantaAtiva}
          plantas={plantas}
          isAprovador={isAprovador}
          isSolicitante={isSolicitante}
          notifCount={notifCount}
          notifItems={notifItems}
          showNotif={showNotif}
          onToggleNotif={() => setShowNotif(s => !s)}
          onSwitchPerfil={switchPerfil}
          onSwitchPlanta={switchPlanta}
        />
      </div>

      {/* Main — com header mobile no topo */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <MobileHeader
          user={user}
          perfil={perfilAtivo}
          perfisReais={perfisReais}
          planta={plantaAtiva}
          plantas={plantas}
          notifCount={notifCount}
          notifItems={notifItems}
          onSwitchPerfil={switchPerfil}
          onSwitchPlanta={switchPlanta}
        />
        {children}
      </main>

      <MobileNav isAprovador={isAprovador} isSolicitante={isSolicitante} />
    </div>
  )
}
