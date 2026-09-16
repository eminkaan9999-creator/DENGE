import { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import type { ExerciseType, Personnel } from './models/types'
import { HomePage } from './pages/HomePage'
import { PersonnelPage } from './pages/PersonnelPage'
import { ExerciseSelectionPage, CameraAnalysisPage, PersonnelSelectionPage, TestSummaryPage } from './pages/TestFlowPages'
import { PersonnelResultsPage, ResultsPage } from './pages/ResultsPages'
import { SettingsPage } from './pages/SettingsPage'
import { AboutPage } from './pages/AboutPage'
import { SplashView } from './pages/SplashView'

type Route =
  | { page: 'home' }
  | { page: 'personnel' }
  | { page: 'selectPersonnel' }
  | { page: 'selectExercise'; personnel: Personnel }
  | { page: 'camera'; personnel: Personnel; exerciseType: ExerciseType }
  | { page: 'summary'; personnel: Personnel; exerciseType: ExerciseType; repetitions: number; date: string }
  | { page: 'results' }
  | { page: 'personnelResults'; personnel: Personnel }
  | { page: 'settings' }
  | { page: 'about' }

export default function App() {
  const [route, setRoute] = useState<Route>({ page: 'home' })
  const [settings, setSettings] = useSettings()
  const [showSplash, setShowSplash] = useState(true)
  useEffect(() => { const timeout = window.setTimeout(() => setShowSplash(false), 700); return () => window.clearTimeout(timeout) }, [])
  if (showSplash) return <SplashView />

  const home = () => setRoute({ page: 'home' })
  let content: React.ReactNode
  switch (route.page) {
    case 'home': content = <HomePage onNavigate={(target) => setRoute({ page: target === 'start' ? 'selectPersonnel' : target })} />; break
    case 'personnel': content = <PersonnelPage onBack={home} onSelect={(personnel) => setRoute({ page: 'selectExercise', personnel })} onOpenResults={(personnel) => setRoute({ page: 'personnelResults', personnel })} />; break
    case 'selectPersonnel': content = <PersonnelSelectionPage onBack={home} onSelect={(personnel) => setRoute({ page: 'selectExercise', personnel })} />; break
    case 'selectExercise': content = <ExerciseSelectionPage personnel={route.personnel} onBack={() => setRoute({ page: 'selectPersonnel' })} onSelect={(exerciseType) => setRoute({ page: 'camera', personnel: route.personnel, exerciseType })} />; break
    case 'camera': content = <CameraAnalysisPage personnel={route.personnel} exerciseType={route.exerciseType} settings={settings} onBack={() => setRoute({ page: 'selectExercise', personnel: route.personnel })} onFinish={(repetitions) => setRoute({ page: 'summary', personnel: route.personnel, exerciseType: route.exerciseType, repetitions, date: new Date().toISOString() })} />; break
    case 'summary': content = <TestSummaryPage personnel={route.personnel} exerciseType={route.exerciseType} repetitionCount={route.repetitions} date={route.date} onRetry={() => setRoute({ page: 'camera', personnel: route.personnel, exerciseType: route.exerciseType })} onCancel={home} />; break
    case 'results': content = <ResultsPage onBack={home} onOpenPersonnel={(personnel) => setRoute({ page: 'personnelResults', personnel })} />; break
    case 'personnelResults': content = <PersonnelResultsPage person={route.personnel} onBack={home} />; break
    case 'settings': content = <SettingsPage settings={settings} onChange={setSettings} onBack={home} />; break
    case 'about': content = <AboutPage onBack={home} />; break
  }
  return <div className="app-shell">{content}</div>
}
