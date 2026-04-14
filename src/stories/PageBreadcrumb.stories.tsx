import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { PageBreadcrumb } from '@/components/sgi/PageBreadcrumb'

const meta: Meta<typeof PageBreadcrumb> = {
  title: 'SGI/Navigation/PageBreadcrumb',
  component: PageBreadcrumb,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof PageBreadcrumb>

export const SolicitationDetail: Story = {
  args: {
    backHref: '/solicitacoes',
    items: [
      { label: 'Solicitações', href: '/solicitacoes' },
      { label: '#2026-0143', href: '/solicitacoes/1' },
      { label: 'Detalhe' },
    ],
  },
}

export const BackofficeEdit: Story = {
  args: {
    backHref: '/admin/equipamentos',
    items: [
      { label: 'Backoffice', href: '/admin' },
      { label: 'Equipamentos', href: '/admin/equipamentos' },
      { label: 'PSH-2204', href: '/admin/equipamentos/psh-2204' },
      { label: 'Editar' },
    ],
  },
}
