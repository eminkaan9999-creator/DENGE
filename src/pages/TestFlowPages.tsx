import { useEffect, useState } from 'react'
import { CameraView } from '../camera/CameraView'
import { AppHeader } from '../components/AppHeader'
import { PersonnelRepository, TestResultRepository } from '../db/database'
import type { AppSettings, ExerciseType, Personnel } from '../models/types'
import { exerciseTitle } from '../models/types'

export function PersonnelSelectionPage({ onBack, onSelect }: { onBack: () => void; onSelect: (personnel: Personnel) => void }) {
  const [people, setPeople] = useState<Personnel[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => { void PersonnelRepository.all().then(setPeople) }, [])
  const filtered = people.filter((person) => `${person.rutbe ?? ''} ${person.ad} ${person.soyad} ${person.sicilNo ?? ''}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')))
  return <main className="page"><AppHeader back={onBack} title="PERSONEL SEÇ" /><input className="input" placeholder="Personel ara" value={query} onChange={(event) => setQuery(event.target.value)} />
    {filtered.map((person) => <button className="menu-card" key={person.id} onClick={() => onSelect(person)}><span className="menu-icon">👤</span><span>{person.rutbe && <small>{person.rutbe}<br /></small>}{person.ad} {person.soyad}</span></button>)}
    {!people.length && <section className="card">Henüz personel yok. Önce Personel ekranından kayıt ekleyin veya JSON'dan aktarın.</section>}
  </main>
}

export function ExerciseSelectionPage({ personnel, onBack, onSelect }: { personnel: Personnel; onBack: () => void; onSelect: (exercise: ExerciseType) => void }) {
  const entries: Array<[ExerciseType, string]> = [['pushUp', '💪'], ['sitUp', '⌁'], ['pullUp', '↟']]
  return <main className="page"><AppHeader back={onBack} title={`${personnel.ad} ${personnel.soyad} · HAREKET SEÇ`} />
    {entries.map(([exercise, icon]) => <button key={exercise} className="menu-card" onClick={() => onSelect(exercise)}><span className="menu-icon">{icon}</span>{exerciseTitle[exercise]}</button>)}
  </main>
}

export function CameraAnalysisPage({ personnel, exerciseType, settings, onBack, onFinish }: { personnel: Personnel; exerciseType: ExerciseType; settings: AppSettings; onBack: () => void; onFinish: (count: number) => void }) {
  return <main className="page"><AppHeader back={onBack} title={`${personnel.ad} ${personnel.soyad} · ${exerciseTitle[exerciseType].toLocaleUpperCase('tr-TR')}`} /><CameraView exerciseType={exerciseType} settings={settings} onFinish={onFinish} /></main>
}

export function TestSummaryPage({ personnel, exerciseType, repetitionCount, date, onRetry, onCancel }: { personnel: Personnel; exerciseType: ExerciseType; repetitionCount: number; date: string; onRetry: () => void; onCancel: () => void }) {
  const [saved, setSaved] = useState(false)
  const save = async () => {
    if (saved) return
    await TestResultRepository.save({ id: crypto.randomUUID(), personnelId: personnel.id, exerciseType, repetitionCount, date })
    setSaved(true)
  }
  const formatted = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
  return <main className="page"><AppHeader title="TEST SONUCU" />
    <section className="card stack"><strong>PERSONEL</strong><span>{personnel.rutbe} {personnel.ad} {personnel.soyad}</span><strong>HAREKET</strong><span>{exerciseTitle[exerciseType]}</span><strong>SONUÇ</strong><div className="result-number">{repetitionCount}</div><span>TEKRAR</span><strong>TARİH</strong><span>{formatted}</span></section>
    <div className="stack"><button className="button" disabled={saved} onClick={() => void save()}>{saved ? 'KAYDEDİLDİ' : 'KAYDET'}</button><button className="button secondary" onClick={onRetry}>TEKRARLA</button><button className="button secondary" onClick={onCancel}>İPTAL</button></div>
  </main>
}
