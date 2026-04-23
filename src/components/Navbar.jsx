import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [fechaHora, setFechaHora] = useState(new Date());
  const [clima, setClima] = useState({ temp: '--', icon: '☀️' });
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const obtenerClima = async () => {
      try {
        const lat = -31.42;
        const lon = -64.50;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();
        
        setClima({
          temp: Math.round(data.current_weather.temperature),
          icon: data.current_weather.temperature > 20 ? '☀️' : '☁️' 
        });
      } catch (error) {
        console.error("Error al clima:", error);
      }
    };
    obtenerClima();
    const climaTimer = setInterval(obtenerClima, 1800000);
    return () => clearInterval(climaTimer);
  }, []);

  const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fechaFormateada = fechaHora.toLocaleDateString('es-AR', opcionesFecha);
  const horaFormateada = fechaHora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  // LISTA COMPLETA Y SINCRONIZADA CON EL ADMIN
  const categorias = [
    'Sociedad', 
    'Deportes', 
    'Sucesos', 
    'Política', 
    'Economía', 
    'Turismo', 
    'Villa Carlos Paz', 
    'Cultura', 
    'Tecnología', 
    'Salud',
    'Mundo'
  ];

  return (
    <>
      <header className="w-full font-sans shadow-md relative z-30">
        <div className="bg-orange-600 text-white flex items-center justify-between px-4 py-4 md:px-8">
          
          <button 
            onClick={() => setMenuAbierto(true)}
            className="p-1 hover:text-orange-200 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center">
            <Link to="/" className="text-3xl md:text-5xl font-bold tracking-tighter font-serif text-white drop-shadow-md italic">
              DIARIO IMPACTO
            </Link>
            <div className="text-[10px] md:text-xs mt-1 flex flex-wrap justify-center items-center gap-2 font-bold text-orange-100 uppercase tracking-widest">
              <span>{fechaFormateada}</span>
              <span className="hidden md:inline opacity-50">•</span>
              <span className="bg-white text-orange-600 px-2 py-0.5 rounded-sm">{horaFormateada}</span>
              <span className="opacity-50">•</span>
              <span className="text-white flex items-center gap-1 uppercase">
                 V. Carlos Paz {clima.icon} {clima.temp}°C
              </span>
            </div>
          </div>

          <div className="w-8"></div>
        </div>

        {/* NAVEGACIÓN SUPERIOR: Ahora muestra todas las categorías */}
        <nav className="bg-slate-900 text-gray-200 text-[11px] font-black uppercase tracking-[0.15em] overflow-x-auto no-scrollbar">
          <ul className="flex items-center md:justify-center gap-6 px-6 py-4 min-w-max">
            <li><Link to="/" className="hover:text-orange-500 transition-colors">Inicio</Link></li>
            {categorias.map(cat => (
              <li key={cat}>
                <Link to={`/?categoria=${cat}`} className="hover:text-orange-500 transition-colors whitespace-nowrap">{cat}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400"></div>
      </header>

      {/* OVERLAY */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* MENÚ LATERAL (Sidebar) */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-r-[6px] border-orange-600 shadow-2xl ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <Link to="/" onClick={() => setMenuAbierto(false)} className="text-2xl font-black font-serif italic text-white tracking-tighter hover:text-orange-100 transition-colors">
              IMPACTO<span className="text-orange-600">.</span>
            </Link>
            <button 
              onClick={() => setMenuAbierto(false)} 
              className="p-2 bg-slate-800 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Secciones</h3>
            <ul className="space-y-4 font-medium text-lg">
              <li><Link to="/" onClick={() => setMenuAbierto(false)} className="hover:text-orange-400 transition-colors block">Inicio</Link></li>
              {categorias.map(cat => (
                <li key={cat}>
                  <Link to={`/?categoria=${cat}`} onClick={() => setMenuAbierto(false)} className="hover:text-orange-400 transition-colors block">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 pt-6 border-t border-slate-800">
            <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Institucional</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li><Link to="/contacto" onClick={() => setMenuAbierto(false)} className="hover:text-white transition-colors block">Contacto</Link></li>
              <li><Link to="/publicidad" onClick={() => setMenuAbierto(false)} className="hover:text-white transition-colors block">Publicidad</Link></li>
            </ul>
          </div>

          {/* REDES SOCIALES */}
          <div className="pt-6 border-t border-slate-800">
            <p className="text-xs text-gray-500 mb-3">Seguinos:</p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/diarioelimpacto" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}