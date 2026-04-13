'use client'
import React, { forwardRef, useId } from 'react'

export type InputVariant = 'default' | 'error' | 'success'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  errorMessage?: string
  successMessage?: string
  variant?: InputVariant
  size?: InputSize
  required?: boolean
  leadingIcon?: string
  trailingIcon?: string
  /** Show character counter */
  maxLength?: number
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  errorMessage?: string
  successMessage?: string
  variant?: InputVariant
  required?: boolean
  rows?: number
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  errorMessage?: string
  successMessage?: string
  variant?: InputVariant
  required?: boolean
  placeholder?: string
  children: React.ReactNode
}

function MaterialIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

const SIZE_HEIGHT: Record<InputSize, string> = {
  sm: '32px',
  md: '36px',
  lg: '40px',
}
const SIZE_FONT: Record<InputSize, string> = {
  sm: '13px',
  md: '14px',
  lg: '15px',
}
const SIZE_PADDING: Record<InputSize, string> = {
  sm: '0 10px',
  md: '0 12px',
  lg: '0 14px',
}

/** Wraps label + hint + error + success around any form field */
function FieldWrapper({
  id,
  label,
  hint,
  errorMessage,
  successMessage,
  variant,
  required,
  children,
}: {
  id: string
  label?: string
  hint?: string
  errorMessage?: string
  successMessage?: string
  variant?: InputVariant
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="field-required" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {variant === 'error' && errorMessage && (
        <p className="field-error-msg" role="alert">
          <MaterialIcon name="error" size={13} />
          {errorMessage}
        </p>
      )}
      {variant === 'success' && successMessage && (
        <p className="field-success-msg">
          <MaterialIcon name="check_circle" size={13} />
          {successMessage}
        </p>
      )}
      {hint && !errorMessage && !successMessage && (
        <p className="field-hint">{hint}</p>
      )}
      {hint && (variant === 'error' || variant === 'success') && (
        <p className="field-hint">{hint}</p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    errorMessage,
    successMessage,
    variant = 'default',
    size = 'md',
    required,
    leadingIcon,
    trailingIcon,
    maxLength,
    className = '',
    id: idProp,
    value,
    defaultValue,
    ...rest
  },
  ref
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const stateClass =
    variant === 'error' ? ' field-input--error' :
    variant === 'success' ? ' field-input--success' : ''

  const hasIcon = leadingIcon || trailingIcon
  const inputStyle: React.CSSProperties = {
    height: SIZE_HEIGHT[size],
    fontSize: SIZE_FONT[size],
    padding: hasIcon
      ? `0 ${trailingIcon ? '36px' : '12px'} 0 ${leadingIcon ? '36px' : '12px'}`
      : SIZE_PADDING[size],
  }

  if (!hasIcon) {
    return (
      <FieldWrapper
        id={id}
        label={label}
        hint={hint}
        errorMessage={errorMessage}
        successMessage={successMessage}
        variant={variant}
        required={required}
      >
        <input
          ref={ref}
          id={id}
          className={`field-input${stateClass} ${className}`.trim()}
          style={inputStyle}
          required={required}
          maxLength={maxLength}
          aria-invalid={variant === 'error'}
          aria-describedby={errorMessage ? `${id}-error` : hint ? `${id}-hint` : undefined}
          value={value}
          defaultValue={defaultValue}
          {...rest}
        />
        {maxLength && typeof value === 'string' && (
          <p className="field-hint" style={{ textAlign: 'right' }}>
            {value.length}/{maxLength}
          </p>
        )}
      </FieldWrapper>
    )
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      successMessage={successMessage}
      variant={variant}
      required={required}
    >
      <div style={{ position: 'relative' }}>
        {leadingIcon && (
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <MaterialIcon name={leadingIcon} size={16} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`field-input${stateClass} ${className}`.trim()}
          style={inputStyle}
          required={required}
          maxLength={maxLength}
          aria-invalid={variant === 'error'}
          value={value}
          defaultValue={defaultValue}
          {...rest}
        />
        {trailingIcon && (
          <span
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <MaterialIcon name={trailingIcon} size={16} />
          </span>
        )}
      </div>
    </FieldWrapper>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, errorMessage, successMessage, variant = 'default', required, rows = 3, className = '', id: idProp, ...rest },
  ref
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const stateClass =
    variant === 'error' ? ' field-input--error' :
    variant === 'success' ? ' field-input--success' : ''

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      successMessage={successMessage}
      variant={variant}
      required={required}
    >
      <textarea
        ref={ref}
        id={id}
        className={`field-input${stateClass} ${className}`.trim()}
        rows={rows}
        required={required}
        aria-invalid={variant === 'error'}
        {...rest}
      />
    </FieldWrapper>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, errorMessage, successMessage, variant = 'default', required, placeholder, className = '', id: idProp, children, ...rest },
  ref
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const stateClass =
    variant === 'error' ? ' field-input--error' :
    variant === 'success' ? ' field-input--success' : ''

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      successMessage={successMessage}
      variant={variant}
      required={required}
    >
      <select
        ref={ref}
        id={id}
        className={`field-input${stateClass} ${className}`.trim()}
        required={required}
        aria-invalid={variant === 'error'}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
    </FieldWrapper>
  )
})
