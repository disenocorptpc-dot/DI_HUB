

function App() {
  return (
    <div className="min-h-screen bg-surface-dark">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 h-16 bg-surface-dark border-b border-primary/10">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-primary-container tracking-tighter font-headline-md">Corporate Hub</h1>
        </div>
        <div className="flex items-center gap-4">
            <button className="w-full bg-primary-container text-surface-dark font-bold py-1.5 px-4 rounded transition-all hover:bg-primary text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Nuevo Aporte
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-surface flex justify-center items-center">
                <span className="material-symbols-outlined text-slate-400">person</span>
            </div>
        </div>
      </header>
      
      <main className="pt-24 pb-12 px-8 max-w-[1440px] mx-auto">
         <div className="mb-10">
              <h3 className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-1">Misión Control</h3>
              <h2 className="text-3xl font-headline-xl text-white">Ecosistema de Herramientas (React)</h2>
              <div className="h-1 w-12 bg-primary mt-4"></div>
          </div>
          <div className="p-6 bg-surface border border-primary/20 rounded">
            <p className="text-primary font-mono">¡Tailwind v4 y React funcionando correctamente! Listo para migrar componentes.</p>
          </div>
      </main>
    </div>
  )
}

export default App
