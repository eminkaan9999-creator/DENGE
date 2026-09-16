import { useState } from 'react'
import { defaultSettings, type AppSettings } from '../models/types'

const storageKey = 'denge-settings'

function readSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function useSettings(): [AppSettings, (next: AppSettings) => void] {
  const [settings, setSettings] = useState<AppSettings>(readSettings)
  const update = (next: AppSettings) => {
    setSettings(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }
  return [settings, update]
}
