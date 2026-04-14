import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { ClasseBadge } from '@/components/sgi/ClasseBadge'
import type { ClasseNum } from '@/lib/tokens'

const classes: ClasseNum[] = [1, 2, 3, 4, 5]

const meta: Meta<typeof ClasseBadge> = {
  title: 'SGI/Badges/ClasseBadge',
  component: ClasseBadge,
  parameters: {
    layout: 'centered',
  },
  args: {
    classe: 2,
    showPrazo: true,
    size: 'md',
  },
  argTypes: {
    classe: { control: 'inline-radio', options: classes },
    showPrazo: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
}

export default meta
type Story = StoryObj<typeof ClasseBadge>

export const Playground: Story = {}

export const AllClasses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {classes.map(classe => (
        <ClasseBadge key={classe} classe={classe} showPrazo />
      ))}
    </div>
  ),
}
