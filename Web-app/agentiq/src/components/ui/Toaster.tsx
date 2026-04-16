import { useToastStore } from '@/store/toastStore'
import { clsx } from 'clsx'

const typeStyles: Record<string, string> = {
  success: 'border-green/30 text-green',
  error:   'border-red/30 text-red',
  warning: 'border-orange/30 text-orange',
  info:    'border-teal/30 text-teal',
}

export function Toaster() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'flex items-center gap-3 px-5 py-3 rounded font-sans text-sm text-text-primary animate-fade-in',
            'border',
            'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
            typeStyles[t.type] ?? typeStyles.info
          )}
          style={{ background: '#0f1e35' }}
          onClick={() => remove(t.id)}
        >
          {t.icon && <span className="text-base">{t.icon}</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
