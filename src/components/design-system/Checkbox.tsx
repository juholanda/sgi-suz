'use client'
import * as React from 'react'

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: React.ReactNode
  disabled?: boolean
  name?: string
  value?: string
  id?: string
}

function CheckIcon() {
  return (
    <svg fill="white" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  )
}

export function Checkbox({ checked, defaultChecked, onCheckedChange, label, disabled, name, value, id }: CheckboxProps) {
  const generatedId = React.useId()
  const checkboxId = id ?? generatedId

  // Support both controlled and uncontrolled
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false)
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : internalChecked

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternalChecked(e.target.checked)
    onCheckedChange?.(e.target.checked)
  }

  return (
    <label
      htmlFor={checkboxId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        value={value}
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      {/* Visual checkbox */}
      <span
        style={{
          display: 'inline-flex',
          width: 18,
          height: 18,
          minWidth: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          border: `1.5px solid ${isChecked ? '#0038A8' : '#CBD5E1'}`,
          background: isChecked ? '#0038A8' : 'white',
          transition: 'background 0.12s ease, border-color 0.12s ease',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {isChecked && <CheckIcon />}
      </span>
      {label && (
        <span style={{ fontSize: 14, color: '#374151', lineHeight: '20px' }}>
          {label}
        </span>
      )}
    </label>
  )
}
