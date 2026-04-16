import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="input-label">{label}</label>}
      <input
        ref={ref}
        className={clsx('input-field', error && 'border-red focus:border-red focus:shadow-none', className)}
        {...props}
      />
      {error && <p className="text-xs text-red font-mono">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="input-label">{label}</label>}
      <select
        ref={ref}
        className={clsx('input-field cursor-pointer', error && 'border-red', className)}
        style={{ background: '#091221' }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#091221' }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red font-mono">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="input-label">{label}</label>}
      <textarea
        ref={ref}
        className={clsx('input-field resize-none', error && 'border-red', className)}
        {...props}
      />
      {error && <p className="text-xs text-red font-mono">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
