import { AppHeader } from '../components/AppHeader'

export function AboutPage({ onBack }: { onBack: () => void }) {
  return <main className="page"><AppHeader back={onBack} title="HAKKINDA" /><section className="card stack"><strong>DENGE</strong><span>Fiziki Hareket Sayım ve Duruş İzleme Sistemi</span><p className="muted">Kamera görüntüsü kaydedilmez ve sunucuya gönderilmez. Pose analizi tarayıcıda, personel ve sonuçlar bu cihazdaki IndexedDB içinde tutulur.</p></section></main>
}
