import { useState, useEffect } from 'react';

type Item = {
  id: number;
  type: 'webapp' | 'prompt' | 'link';
  title: string;
  category: string;
  url: string;
  content: string;
};

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('bg-primary');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error("Error fetching items", e);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, colorClass = "bg-primary") => {
    setToastMessage(message);
    setToastColor(colorClass);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("✅ Copiado al portapapeles", "bg-primary");
    });
  };

  const toggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const btn = e.currentTarget;
    btn.classList.toggle('text-yellow-400');
    btn.classList.toggle('favorite-active');
    
    if(btn.classList.contains('favorite-active')) showToast("⭐ Añadido a favoritos", "bg-yellow-400");
    else showToast("Retirado de favoritos", "bg-slate-400");
  };

  // Modals state
  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [aporteType, setAporteType] = useState<'webapp' | 'prompt' | 'link'>('webapp');
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formContent, setFormContent] = useState('');

  const [appDetailModalOpen, setAppDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState({ title: '', user: '', pass: '' });

  const [promptDetailModalOpen, setPromptDetailModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState({ title: '', aiTarget: '', aiClass: '', description: '', content: '' });

  const openAppDetail = (e: React.MouseEvent, title: string, user: string, pass: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedApp({ title, user, pass });
    setAppDetailModalOpen(true);
  };

  const openPromptDetail = (title: string, aiTarget: string, aiClass: string, description: string, content: string) => {
    setSelectedPrompt({ title, aiTarget, aiClass, description, content });
    setPromptDetailModalOpen(true);
  };

  const saveAporte = async () => {
    if(!formTitle) {
      showToast("El título es obligatorio", "bg-red-400");
      return;
    }
    try {
      const payload = {
        type: aporteType,
        title: formTitle,
        category: formCategory || 'General',
        url: formUrl,
        content: formContent
      };
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        showToast("🚀 Aporte guardado exitosamente.", "bg-emerald-400");
        setAporteModalOpen(false);
        setFormTitle(''); setFormCategory(''); setFormUrl(''); setFormContent('');
        fetchItems(); // refresh list
      } else {
        showToast("Error al guardar (¿Base de datos conectada?)", "bg-red-400");
      }
    } catch(e) {
      showToast("Error de conexión con la base de datos", "bg-red-400");
    }
  };

  const deleteItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    if(window.confirm("¿Estás seguro de que deseas eliminar este aporte?")) {
        try {
            const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
            if(res.ok) {
              setItems(items.filter(item => item.id !== id));
              showToast("🗑️ Aporte eliminado", "bg-slate-500");
            }
        } catch(e) {
            showToast("Error al eliminar", "bg-red-500");
        }
    }
  };

  // Scroll to section smoothly
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const webapps = items.filter(i => i.type === 'webapp');
  const prompts = items.filter(i => i.type === 'prompt');
  const links = items.filter(i => i.type === 'link');

  return (
    <div className="min-h-screen bg-surface-dark font-body-md text-slate-200 selection:bg-primary-container selection:text-surface-dark">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 py-3 h-16 bg-surface-dark border-b border-primary/10">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-primary-container tracking-tighter font-headline-md">Corporate Hub</h1>
            <div className="hidden md:flex items-center bg-surface rounded px-3 py-1.5 border border-primary/10 w-96 transition-colors focus-within:border-primary/50">
                <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
                <input className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-200 placeholder-slate-500 outline-none" placeholder="Buscar web apps, prompts, links..." type="text"/>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setAporteModalOpen(true)} className="w-full bg-primary-container text-surface-dark font-bold py-1.5 px-4 rounded transition-all hover:bg-primary text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Nuevo Aporte
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-surface flex justify-center items-center">
                <span className="material-symbols-outlined text-slate-400">person</span>
            </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-screen pt-20 pb-6 w-64 bg-surface border-r border-primary/10 fixed left-0 top-0 z-30">
          <nav className="flex-1 px-2 space-y-2 mt-4">
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-label-sm mb-2">Directorio</p>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-full flex items-center gap-3 bg-surface-dark text-primary-container border-l-2 border-primary-container px-4 py-2.5 transition-all text-sm font-medium">
                  <span className="material-symbols-outlined">dashboard</span> <span>Dashboard</span>
              </button>
              <button onClick={() => scrollTo('webapps')} className="w-full flex items-center gap-3 text-slate-400 px-4 py-2.5 hover:bg-surface-dark/50 hover:text-primary transition-all text-sm">
                  <span className="material-symbols-outlined">apps</span> <span>Web Apps & Tools</span>
              </button>
              <button onClick={() => scrollTo('prompts')} className="w-full flex items-center gap-3 text-slate-400 px-4 py-2.5 hover:bg-surface-dark/50 hover:text-primary transition-all text-sm">
                  <span className="material-symbols-outlined">terminal</span> <span>Prompt Masters</span>
              </button>
              <button onClick={() => scrollTo('links')} className="w-full flex items-center gap-3 text-slate-400 px-4 py-2.5 hover:bg-surface-dark/50 hover:text-primary transition-all text-sm">
                  <span className="material-symbols-outlined">folder_shared</span> <span>SharePoint & Links</span>
              </button>
              
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-label-sm mt-8 mb-2">Colecciones</p>
              <button className="w-full flex items-center gap-3 text-slate-400 px-4 py-2.5 hover:bg-surface-dark/50 hover:text-yellow-400 transition-all text-sm">
                  <span className="material-symbols-outlined">star</span>
                  <span>Mis Favoritos</span>
              </button>
          </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-24 pb-12 min-h-screen">
          <div className="max-w-[1440px] mx-auto px-8">
              <div className="mb-10">
                  <h3 className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-1">Misión Control</h3>
                  <h2 className="text-3xl font-headline-xl text-white">Ecosistema de Herramientas</h2>
                  <div className="h-1 w-12 bg-primary mt-4"></div>
              </div>

              {isLoading ? (
                  <div className="text-slate-400 animate-pulse flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Cargando base de datos...</div>
              ) : items.length === 0 ? (
                  <div className="p-10 border border-dashed border-primary/20 rounded text-center text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-3 opacity-50">database</span>
                      <p>La base de datos está vacía. ¡Agrega tu primer aporte!</p>
                  </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* Left Column: Web Apps */}
                    <div className="xl:col-span-7 space-y-8" id="webapps">
                        <section className="bg-surface border border-primary/10 p-6 rounded-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-headline-md text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">apps</span> Web Apps Internas
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {webapps.map(app => (
                                    <div key={app.id} className="bg-surface-dark border border-primary/10 p-5 group hover:border-primary/40 hover:bg-primary/5 transition-all rounded-sm flex flex-col relative cursor-pointer" 
                                        onClick={() => { window.open(app.url || '#', '_blank'); showToast(`Abriendo ${app.title}...`, 'bg-emerald-400'); }}>
                                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                                            <button className="text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => deleteItem(e, app.id)} title="Eliminar">
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                            <button className="text-slate-600 hover:text-primary transition-colors" onClick={(e) => openAppDetail(e, app.title, 'usuario@hub.corp', '***')} title="Ver Credenciales">
                                                <span className="material-symbols-outlined text-xl">vpn_key</span>
                                            </button>
                                            <button className="text-slate-600 hover:text-yellow-400 transition-colors" onClick={toggleFavorite} title="Favorito">
                                                <span className="material-symbols-outlined text-xl">star</span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined">open_in_new</span>
                                            </div>
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 mr-24">{app.category}</span>
                                        </div>
                                        <h4 className="text-lg text-white font-medium group-hover:text-primary transition-colors">{app.title}</h4>
                                        
                                        <div className="mt-4 border-t border-primary/10 pt-3 flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">Lanzar App</span>
                                            <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Prompts & Links */}
                    <div className="xl:col-span-5 space-y-8">
                        {/* Prompts Section */}
                        <section id="prompts" className="bg-surface border border-primary/10 p-6 rounded-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-headline-md text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">terminal</span> Prompt Masters
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {prompts.map(prompt => (
                                    <div key={prompt.id} className="bg-surface-dark border border-primary/10 p-4 group hover:border-accent-antigravity/40 transition-all rounded-sm relative cursor-pointer" 
                                        onClick={() => openPromptDetail(prompt.title, prompt.category, 'bg-accent-antigravity/10 text-accent-antigravity border-accent-antigravity/20', 'Prompt guardado dinámicamente.', prompt.content)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-accent-antigravity/10 text-accent-antigravity px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-accent-antigravity/20 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span> {prompt.category}
                                                </span>
                                                <span className="text-xs text-slate-300 font-bold truncate max-w-[120px]">{prompt.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 z-10 relative">
                                                <button className="text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => deleteItem(e, prompt.id)} title="Eliminar"><span className="material-symbols-outlined text-lg">delete</span></button>
                                                <button className="text-slate-600 hover:text-yellow-400 transition-colors" onClick={toggleFavorite}><span className="material-symbols-outlined text-lg">star</span></button>
                                                <button className="text-slate-500 hover:text-white transition-colors bg-surface border border-primary/10 rounded px-2 py-1 flex items-center gap-1 text-[10px] uppercase font-bold" 
                                                        onClick={(e) => { e.stopPropagation(); copyText(prompt.content); }}><span className="material-symbols-outlined text-sm">content_copy</span> Copiar</button>
                                            </div>
                                        </div>
                                        <div className="bg-black/30 p-3 rounded border border-white/5 mt-3 h-20 overflow-hidden relative fade-bottom">
                                            <code className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{prompt.content}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SharePoint & Links Section */}
                        <section id="links" className="bg-surface border border-primary/10 p-6 rounded-sm">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-headline-md text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">folder_shared</span> SharePoint & Docs
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {links.map(link => (
                                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer" onClick={(e) => { if(link.url==='#') e.preventDefault(); showToast(`Abriendo ${link.title}...`, 'bg-blue-400'); }} className="flex items-center justify-between p-3 bg-surface-dark hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all rounded-sm group relative">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <span className="material-symbols-outlined text-lg">link</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{link.title}</p>
                                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{link.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-red-400/50 hover:text-red-400 transition-all" onClick={(e) => deleteItem(e, link.id)} title="Eliminar"><span className="material-symbols-outlined text-sm">delete</span></button>
                                            <button className="text-slate-500 hover:text-yellow-400 transition-colors" onClick={toggleFavorite}><span className="material-symbols-outlined text-sm">star</span></button>
                                            <span className="material-symbols-outlined text-slate-400 text-sm">open_in_new</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
              )}
          </div>
      </main>

      {/* MODAL: App Credentials Vault */}
      {appDetailModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAppDetailModalOpen(false)}></div>
            <div className="relative w-full max-w-sm bg-surface border border-primary/20 rounded-sm shadow-2xl flex flex-col m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-5 border-b border-primary/10 bg-surface-dark rounded-t-sm">
                    <h3 className="text-xl font-headline-md text-white">{selectedApp.title}</h3>
                    <button className="text-slate-400 hover:text-white transition-colors bg-surface p-1 rounded border border-primary/10" onClick={() => setAppDetailModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-6">
                    <div className="bg-[#04080c] border border-primary/20 p-5 rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><span className="material-symbols-outlined text-6xl">admin_panel_settings</span></div>
                        <label className="block text-xs font-label-sm text-primary uppercase tracking-wider mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-sm">vpn_key</span> Bóveda de Credenciales</label>
                        <div className="mb-4">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Usuario / Email</span>
                            <div className="flex items-center gap-2">
                                <code className="text-[13px] text-white bg-surface p-2 rounded w-full border border-white/5 text-center">{selectedApp.user}</code>
                                <button onClick={() => copyText(selectedApp.user)} className="text-slate-500 hover:text-primary transition-colors bg-surface p-2 rounded border border-white/5"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Contraseña</span>
                            <div className="flex items-center gap-2">
                                <code className="text-[13px] text-white bg-surface p-2 rounded w-full border border-white/5 blur-sm hover:blur-none transition-all cursor-pointer text-center">{selectedApp.pass}</code>
                                <button onClick={() => copyText(selectedApp.pass)} className="text-slate-500 hover:text-primary transition-colors bg-surface p-2 rounded border border-white/5"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: Prompt Detail */}
      {promptDetailModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPromptDetailModalOpen(false)}></div>
            <div className="relative w-full max-w-3xl bg-surface border border-primary/20 rounded-sm shadow-2xl flex flex-col max-h-[90vh] m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-primary/10 bg-surface-dark rounded-t-sm">
                    <div>
                        <h3 className="text-2xl font-headline-md text-white mb-2">{selectedPrompt.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${selectedPrompt.aiClass}`}>{selectedPrompt.aiTarget}</span>
                    </div>
                    <button className="text-slate-400 hover:text-white bg-surface p-1 rounded border border-primary/10" onClick={() => setPromptDetailModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                    <div>
                        <label className="text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2 block">¿Qué hace este prompt?</label>
                        <p className="text-sm text-slate-200 leading-relaxed bg-surface-dark p-3 rounded-sm border-l-2 border-primary">{selectedPrompt.description}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-label-sm text-slate-400 uppercase tracking-wider flex items-center gap-2"><span className="material-symbols-outlined text-sm">terminal</span> Prompt Maestro</label>
                            <button className="text-slate-300 hover:text-white hover:bg-primary/20 bg-surface border border-primary/20 rounded px-4 py-2 flex items-center gap-2 text-xs uppercase font-bold" onClick={() => copyText(selectedPrompt.content)}>
                                <span className="material-symbols-outlined text-base">content_copy</span> Copiar Código
                            </button>
                        </div>
                        <div className="bg-[#04080c] p-5 rounded border border-white/5">
                            <code className="text-[13px] text-[#bac8da] font-mono whitespace-pre-wrap leading-relaxed block">{selectedPrompt.content}</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: Nuevo Aporte */}
      {aporteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAporteModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-surface border border-primary/20 rounded-sm shadow-2xl flex flex-col max-h-[90vh] m-4 animate-in fade-in slide-in-from-bottom-10 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-primary/10">
                    <h3 className="text-xl font-headline-md text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">add_circle</span> Nuevo Aporte</h3>
                    <button className="text-slate-400 hover:text-white transition-colors" onClick={() => setAporteModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2">¿Qué deseas agregar?</label>
                            <div className="grid grid-cols-3 gap-1 bg-surface-dark p-1 border border-primary/10 rounded-sm">
                                <button className={`font-medium py-1.5 rounded-sm text-xs transition-all ${aporteType === 'webapp' ? 'bg-surface border border-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setAporteType('webapp')}>Web App</button>
                                <button className={`font-medium py-1.5 rounded-sm text-xs transition-all ${aporteType === 'prompt' ? 'bg-surface border border-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setAporteType('prompt')}>Prompt</button>
                                <button className={`font-medium py-1.5 rounded-sm text-xs transition-all ${aporteType === 'link' ? 'bg-surface border border-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setAporteType('link')}>Link/Doc</button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2">Título / Nombre</label>
                                <input type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors" placeholder="Ej. Yield Manager 3D" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2">
                                    {aporteType === 'webapp' ? 'Categoría / Departamento' : aporteType === 'prompt' ? 'IA Recomendada (Ej. Claude)' : 'Ubicación (Ej. SharePoint)'}
                                </label>
                                {aporteType === 'webapp' ? (
                                    <select value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors appearance-none">
                                        <option value="Producción">Producción</option><option value="Fabricación">Fabricación</option><option value="Retail">Retail</option><option value="General">General</option>
                                    </select>
                                ) : (
                                    <input type="text" value={formCategory} onChange={e=>setFormCategory(e.target.value)} className="w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors" placeholder="Ej. Claude 3.5 Sonnet / SharePoint" />
                                )}
                            </div>

                            {aporteType !== 'prompt' && (
                                <div>
                                    <label className="block text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2">URL (Enlace)</label>
                                    <input type="text" value={formUrl} onChange={e=>setFormUrl(e.target.value)} className="w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors font-mono" placeholder="https://" />
                                </div>
                            )}

                            {aporteType !== 'link' && (
                                <div>
                                    <label className="block text-xs font-label-sm text-slate-400 uppercase tracking-wider mb-2">
                                        {aporteType === 'webapp' ? 'Descripción Corta' : 'Contenido del Prompt'}
                                    </label>
                                    <textarea value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors h-24 resize-none font-mono" placeholder="Escribe aquí..."></textarea>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-primary/10 flex justify-end gap-3 bg-surface-dark rounded-b-sm">
                    <button className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors font-medium" onClick={() => setAporteModalOpen(false)}>Cancelar</button>
                    <button className="bg-primary text-surface-dark font-bold px-6 py-2 rounded-sm text-sm hover:bg-white transition-colors" onClick={saveAporte}>Guardar</button>
                </div>
            </div>
        </div>
      )}

      {/* Toast Notification */}
      {isToastVisible && (
        <div className={`fixed z-[4000] bottom-[30px] left-1/2 transform -translate-x-1/2 font-bold shadow-lg text-surface-dark text-center rounded-sm p-3 transition-opacity duration-300 ${toastColor} opacity-100`}>
            {toastMessage}
        </div>
      )}
    </div>
  );
}
