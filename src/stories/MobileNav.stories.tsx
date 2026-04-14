import type { Meta, StoryObj } from '@storybook/react-webpack5'
import MobileNav from '@/components/sgi/MobileNav'

const meta: Meta<typeof MobileNav> = {
  title: 'SGI/Navigation/MobileNav',
  component: MobileNav,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof MobileNav>

export const Padrao: Story = {
  args: {
    canSeeBackoffice: false,
  },
}

export const ComBackoffice: Story = {
  args: {
    canSeeBackoffice: true,
  },
}
