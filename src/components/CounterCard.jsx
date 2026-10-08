import { useState } from 'react'
import { Hand, RotateCcw } from 'lucide-react'

export default function CounterCard() {
  const [count, setCount] = useState(0)

  return (
    <section className="rounded-3xl bg-slate-50 p-6 text-center shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Toques</p>
      <p className="my-4 text-6xl font-extrabold tabular-nums text-slate-900">{count}</p>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="flex w-full select-none items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-5 text-lg font-semibold text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 active:bg-indigo-700"
      >
        <Hand size={24} />
        ¡Tócame!
      </button>

      <button
        type="button"
        onClick={() => setCount(0)}
        disabled={count === 0}
        className="mt-3 inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm text-slate-500 transition active:scale-95 active:bg-slate-200 disabled:opacity-40"
      >
        <RotateCcw size={16} />
        Reiniciar
      </button>
    </section>
  )
}
