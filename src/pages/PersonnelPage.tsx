import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { PersonnelJSONImporter, type ImportPreview } from '../import/PersonnelJSONImporter'
import { PersonnelRepository, TestResultRepository } from '../db/database'
import type { Personnel, TestResult } from '../models/types'

interface PersonnelPageProps {
  onBack: () => void
  onSelect: (personnel: Personnel) => void
  onOpenResults: (personnel: Personnel) => void
}

type PersonnelDraft = Omit<Personnel, 'id'>
const blankDraft: PersonnelDraft = { ad: '', soyad: '', sicilNo: '', rutbe: '', birlik: '' }

export function PersonnelPage({ onBack, onSelect, onOpenResults }: PersonnelPageProps) {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<PersonnelDraft>(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = async () => {
    setPersonnel(await PersonnelRepository.all())
    setResults(await TestResultRepository.all())
  }
  useEffect(() => { void reload() }, [])

  const save = async () => {
    if (!draft.ad.trim() || !draft.soyad.trim()) { setError('Ad ve soyad zorunludur.'); return }
    const item: Personnel = { ...draft, id: editingId ?? crypto.randomUUID(), ad: draft.ad.trim(), soyad: draft.soyad.trim() }
    await PersonnelRepository.save(item)
    setDraft(blankDraft); setEditingId(null); setError(''); await reload()
  }
  const edit = (item: Personnel) => { setDraft(item); setEditingId(item.id); setError('') }
  const remove = async (id: string) => {
    if (window.confirm('Personel ve ona ait sonuçlar silinsin mi?')) { await PersonnelRepository.remove(id); await reload() }
  }
  const onFile = async (file?: File) => {
    if (!file) return
    try {
      setPreview(new PersonnelJSONImporter().preview(await file.text(), personnel)); setError('')
    } catch (importError) { setError(importError instanceof Error ? importError.message : 'JSON DOSYASI OKUNAMADI') }
  }
  const applyImport = async () => {
    if (!preview) return
    await PersonnelRepository.saveMany(new PersonnelJSONImporter().toNewPersonnel(preview))
    setPreview(null); await reload()
  }
  const filtered = personnel.filter((person) => `${person.rutbe ?? ''} ${person.ad} ${person.soyad} ${person.sicilNo ?? ''}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')))

  return <main className="page">
    <AppHeader back={onBack} title="PERSONEL" />
    <section className="card stack">
      <strong>{editingId ? 'PERSONELİ DÜZENLE' : 'PERSONEL EKLE'}</strong>
      <div className="split"><input className="input" placeholder="Ad *" value={draft.ad} onChange={(event) => setDraft({ ...draft, ad: event.target.value })} /><input className="input" placeholder="Soyad *" value={draft.soyad} onChange={(event) => setDraft({ ...draft, soyad: event.target.value })} /></div>
      <div className="split"><input className="input" placeholder="Sicil No" value={draft.sicilNo ?? ''} onChange={(event) => setDraft({ ...draft, sicilNo: event.target.value })} /><input className="input" placeholder="Rütbe" value={draft.rutbe ?? ''} onChange={(event) => setDraft({ ...draft, rutbe: event.target.value })} /></div>
      <input className="input" placeholder="Birlik" value={draft.birlik ?? ''} onChange={(event) => setDraft({ ...draft, birlik: event.target.value })} />
      {error && <span className="error">{error}</span>}
      <div className="row"><button className="button" onClick={() => void save()}>{editingId ? 'GÜNCELLE' : 'EKLE'}</button>{editingId && <button className="button secondary" onClick={() => { setDraft(blankDraft); setEditingId(null) }}>VAZGEÇ</button>}</div>
      <input ref={inputRef} hidden type="file" accept=".json,application/json" onChange={(event) => void onFile(event.target.files?.[0])} />
      <button className="button secondary" onClick={() => inputRef.current?.click()}>JSON'DAN AKTAR</button>
    </section>
    <input className="input" placeholder="Personel ara" value={query} onChange={(event) => setQuery(event.target.value)} />
    {filtered.map((person) => <PersonnelCard key={person.id} person={person} results={results} onSelect={onSelect} onEdit={edit} onDelete={remove} onResults={onOpenResults} />)}
    {preview && <ImportPreviewSheet preview={preview} onCancel={() => setPreview(null)} onConfirm={() => void applyImport()} />}
  </main>
}

function PersonnelCard({ person, results, onSelect, onEdit, onDelete, onResults }: { person: Personnel; results: TestResult[]; onSelect: (person: Personnel) => void; onEdit: (person: Personnel) => void; onDelete: (id: string) => void; onResults: (person: Personnel) => void }) {
  const latest = (type: TestResult['exerciseType']) => results.find((result) => result.personnelId === person.id && result.exerciseType === type)?.repetitionCount ?? '—'
  return <section className="card" onClick={() => onResults(person)}>
    <div className="row between"><div><strong>{person.rutbe}</strong><br />{person.ad} {person.soyad}<br /><small className="muted">{person.sicilNo ?? person.birlik ?? '—'}</small></div><button className="button" onClick={(event) => { event.stopPropagation(); onSelect(person) }}>SEÇ</button></div>
    <p className="muted">Şınav: {latest('pushUp')} &nbsp; Mekik: {latest('sitUp')} &nbsp; Barfiks: {latest('pullUp')}</p>
    <div className="row"><button className="button secondary" onClick={(event) => { event.stopPropagation(); onEdit(person) }}>DÜZENLE</button><button className="button danger" onClick={(event) => { event.stopPropagation(); onDelete(person.id) }}>SİL</button></div>
  </section>
}

function ImportPreviewSheet({ preview, onCancel, onConfirm }: { preview: ImportPreview; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><section className="modal"><h2>PERSONEL AKTARIMI</h2><p>Toplam: {preview.total} · Yeni: {preview.newCount} · Mevcut: {preview.existingCount} · Hatalı: {preview.invalidCount}</p>
    <div className="stack">{preview.rows.map((row) => <div className="card compact" key={row.sourceIndex}><div className="row between"><span>{row.dto.ad || '—'} {row.dto.soyad || ''}</span><span className={`badge ${row.status}`}>{row.status === 'NEW' ? 'YENİ' : row.status === 'EXISTING' ? 'MEVCUT' : 'HATALI'}</span></div>{row.reason && <small className="error">{row.reason}</small>}</div>)}</div>
    <div className="row"><button className="button" disabled={!preview.newCount} onClick={onConfirm}>{preview.newCount} YENİ PERSONELİ EKLE</button><button className="button secondary" onClick={onCancel}>İPTAL</button></div>
  </section></div>
}
