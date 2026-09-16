interface AppHeaderProps {
  back?: () => void
  title?: string
}

export function AppHeader({ back, title }: AppHeaderProps) {
  return <header>
    {back && <button className="back" onClick={back}>‹ Geri</button>}
    <h1 className="brand">DENGE</h1>
    <p className="subtitle">{title ?? 'Fiziki Hareket Sayım ve Duruş İzleme Sistemi'}</p>
  </header>
}
