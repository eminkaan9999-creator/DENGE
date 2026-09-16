import { useEffect, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { PersonnelRepository, TestResultRepository } from '../db/database'
import type { Personnel, TestResult } from '../models/types'
import { exerciseTitle } from '../models/types'

export function ResultsPage({ onBack, onOpenPersonnel }: { onBack: () => void; onOpenPersonnel: (person: Personnel) => void }) {
  const [people, setPeople] = useState<Personnel[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  useEffect(() => { void Promise.all([PersonnelRepository.all(), TestResultRepository.all()]).then(([allPeople, allResults]) => { setPeople(allPeople); setResults(allResults) }) }, [])
  return <main className="page"><AppHeader back={onBack} title="SONUÇLAR" />
    {people.map((person) => <button className="menu-card" key={person.id} onClick={() => onOpenPersonnel(person)}><span className="menu-icon">▤</span><span>{person.ad} {person.soyad}<br /><small>Toplam test: {results.filter((result) => result.personnelId === person.id).length}</small></span></button>)}
    {!people.length && <section className="card">Gösterilecek personel veya sonuç yok.</section>}
  </main>
}

export function PersonnelResultsPage({ person, onBack }: { person: Personnel; onBack: () => void }) {
  const [results, setResults] = useState<TestResult[]>([])
  useEffect(() => { void TestResultRepository.forPersonnel(person.id).then(setResults) }, [person.id])
  return <main className="page"><AppHeader back={onBack} title={`${person.ad} ${person.soyad} · GEÇMİŞ`} />
    {results.map((result) => <section className="card" key={result.id}><div className="row between"><strong>{exerciseTitle[result.exerciseType]}</strong><strong>{result.repetitionCount} tekrar</strong></div><small className="muted">{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(result.date))}</small></section>)}
    {!results.length && <section className="card">Bu personele ait kayıtlı test sonucu yok.</section>}
  </main>
}
