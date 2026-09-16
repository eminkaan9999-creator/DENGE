import { useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { exportBackup, restoreBackup } from '../db/database'
import type { AppSettings } from '../models/types'

export function SettingsPage({ settings, onChange, onBack }: { settings: AppSettings; onChange: (settings: AppSettings) => void; onBack: () => void }) {
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const exportData = async () => {
    const json = JSON.stringify(await exportBackup(), null, 2)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `denge-yedek-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url)
    setNotice('Yedek dosyası indirildi.')
  }
  const restoreData = async (file?: File) => {
    if (!file) return
    try { const summary = await restoreBackup(JSON.parse(await file.text())); setNotice(`${summary.personnelAdded} personel ve ${summary.resultsAdded} sonuç eklendi.`) }
    catch { setNotice('Yedek dosyası okunamadı.') }
  }
  const toggle = (key: keyof AppSettings) => onChange({ ...settings, [key]: key === 'facingMode' ? (settings.facingMode === 'environment' ? 'user' : 'environment') : !settings[key] } as AppSettings)
  return <main className="page"><AppHeader back={onBack} title="AYARLAR" />
    <section className="card stack"><strong>KAMERA</strong><button className="button secondary" onClick={() => toggle('facingMode')}>{settings.facingMode === 'environment' ? 'Arka Kamera' : 'Ön Kamera'}</button>
      <Toggle label="İskeleti Göster" value={settings.showSkeleton} onClick={() => toggle('showSkeleton')} /><Toggle label="Eklem Noktalarını Göster" value={settings.showJoints} onClick={() => toggle('showJoints')} /><Toggle label="Duruş Renklendirmesi" value={settings.useFormColors} onClick={() => toggle('useFormColors')} /></section>
    <section className="card stack"><strong>VERİ YEDEKLEME</strong><button className="button" onClick={() => void exportData()}>VERİLERİ DIŞA AKTAR</button><input ref={inputRef} hidden type="file" accept=".json,application/json" onChange={(event) => void restoreData(event.target.files?.[0])} /><button className="button secondary" onClick={() => inputRef.current?.click()}>YEDEKTEN GERİ YÜKLE</button>{notice && <small>{notice}</small>}</section>
    <section className="card"><small className="muted">Personel ve test verileri bu cihazda saklanır. Tarayıcı/site verilerinin silinmesi kayıtların kaybolmasına neden olabilir. Düzenli olarak JSON yedek alınması önerilir.</small></section>
  </main>
}

function Toggle({ label, value, onClick }: { label: string; value: boolean; onClick: () => void }) { return <button className="menu-card compact" onClick={onClick}><span>{label}</span><strong>{value ? 'AÇIK' : 'KAPALI'}</strong></button> }
