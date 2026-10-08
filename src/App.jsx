import Header from './components/Header.jsx'
import CounterCard from './components/CounterCard.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      <div className="w-full max-w-md min-h-screen bg-white shadow-2xl flex flex-col justify-between p-4 overflow-hidden">
        <Header />

        <main className="flex flex-1 flex-col justify-center py-6">
          <CounterCard />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
