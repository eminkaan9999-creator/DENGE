import { AppHeader } from '../components/AppHeader'

type HomeTarget = 'start' | 'personnel' | 'results' | 'settings' | 'about'
interface HomePageProps { onNavigate: (target: HomeTarget) => void }

const entries: Array<{ target: HomeTarget; icon: string; label: string }> = [
  { target: 'start', icon: '▶', label: 'TEST BAŞLAT' },
  { target: 'personnel', icon: '👤', label: 'PERSONEL' },
  { target: 'results', icon: '▤', label: 'SONUÇLAR' },
  { target: 'settings', icon: '⚙', label: 'AYARLAR' },
  { target: 'about', icon: 'i', label: 'HAKKINDA' },
]

export function HomePage({ onNavigate }: HomePageProps) {
  return <main className="page">
    <AppHeader />
    {entries.map((entry) => <button key={entry.label} className="menu-card" onClick={() => onNavigate(entry.target)}>
      <span className="menu-icon">{entry.icon}</span>{entry.label}
    </button>)}
  </main>
}
