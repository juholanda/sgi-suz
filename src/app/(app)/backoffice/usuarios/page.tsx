import { prisma } from '@/lib/db'
import UsuariosClient from './UsuariosClient'

async function getData() {
  const [usuarios, plantas, areas] = await Promise.all([
    prisma.user.findMany({
      include: { perfis: { include: { planta: true, area: true } } },
      orderBy: { nome: 'asc' },
    }),
    prisma.planta.findMany({ orderBy: { nome: 'asc' } }),
    prisma.area.findMany({
      orderBy: [{ planta: { nome: 'asc' } }, { nome: 'asc' }],
    }),
  ])
  return { usuarios, plantas, areas }
}

export default async function UsuariosPage() {
  const { usuarios, plantas, areas } = await getData()

  return (
    <UsuariosClient
      usuarios={usuarios}
      plantas={plantas}
      areas={areas}
    />
  )
}
