import { useState, useCallback } from 'react'

/**
 * Like useState but persisted to localStorage.
 * Falls back gracefully if localStorage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch {
        // Silently ignore write errors (private mode, quota exceeded, etc.)
      }
    },
    [key, storedValue]
  )

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch {
      // ignore
    }
  }, [key, initialValue])

  return [storedValue, setValue, remove] as const
}
