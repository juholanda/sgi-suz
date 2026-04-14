import type { Meta, StoryObj } from '@storybook/react-webpack5'
import Sidebar from '@/components/sgi/Sidebar'
import { SessionProvider } from 'next-auth/react'

const meta: Meta<typeof Sidebar> = {
  title: 'SGI/Navigation/Sidebar',
  component: Sidebar,
  decorators: [
    Story => (
      <SessionProvider>
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Solicitante: Story = {
  args: {
    user: {
      name: 'João Silva',
      email: 'joao.silva@suzano.com.br',
      perfis: ['SOLICITANTE'],
      plantaAtivaNome: 'Planta 1',
      perfilAtivoNome: 'Solicitante',
    },
  },
}

export const Administrador: Story = {
  args: {
    user: {
      name: 'Admin SGI',
      email: 'admin@suzano.com.br',
      perfis: ['ADMINISTRADOR', 'APROVADOR'],
      plantaAtivaNome: 'Planta 1',
      perfilAtivoNome: 'Administrador',
    },
  },
}
