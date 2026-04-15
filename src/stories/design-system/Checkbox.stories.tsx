import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Checkbox } from '@/components/design-system/Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Checkbox',
  component: Checkbox,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  name: 'Padrão',
  args: {
    label: 'Opção de exemplo',
    defaultChecked: false,
  },
}

export const Checked: Story = {
  name: 'Marcado',
  args: {
    label: 'Opção marcada',
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  name: 'Desabilitado',
  args: {
    label: 'Opção desabilitada',
    disabled: true,
    defaultChecked: false,
  },
}

export const DisabledChecked: Story = {
  name: 'Desabilitado marcado',
  args: {
    label: 'Opção desabilitada e marcada',
    disabled: true,
    defaultChecked: true,
  },
}

export const Grupo: Story = {
  name: 'Grupo de checkboxes',
  render: () => {
    const [values, setValues] = useState(['medida1'])
    const toggle = (v: string) =>
      setValues(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

    const medidas = [
      { id: 'medida1', label: 'Monitoramento manual periódico da área', obrigatorio: true },
      { id: 'medida2', label: 'Isolamento de área com fita de segurança', obrigatorio: true },
      { id: 'medida3', label: 'Sinalização adicional de perigo', obrigatorio: true },
      { id: 'medida4', label: 'Procedimentos operacionais alternativos', obrigatorio: true },
      { id: 'medida5', label: 'Inspeção visual a cada 2 horas', obrigatorio: false },
      { id: 'medida6', label: 'Comunicação formal ao supervisor', obrigatorio: false },
    ]

    return (
      <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 600 }}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 1.6 }}>
          Exemplo com medidas obrigatórias e opcionais. As obrigatórias não podem ser desmarcadas.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
          {medidas.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Checkbox
                checked={values.includes(m.id) || m.obrigatorio}
                onCheckedChange={() => !m.obrigatorio && toggle(m.id)}
                disabled={m.obrigatorio}
                label={
                  <span>
                    {m.label}
                    {m.obrigatorio && (
                      <span style={{ marginLeft: 4, fontSize: 12, color: '#DC2626', fontWeight: 500 }}>
                        (obrigatório)
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
}
