import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-300 py-16 mt-12 font-sans border-t-[6px] border-orange-600">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Marca y Propósito */}
        <div className="space-y-6">
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tighter">
            IMPACTO<span className="text-orange-600">.</span>
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
            Impacto nace en Punilla para informar con compromiso y verdad. Buscamos conectar y fortalecer lo local, provincial y nacional.
          </p>
          <div className="flex gap-4">
            
            {/* LINK A TU INSTAGRAM CON ICONO SVG */}
            <a 
              href="https://www.instagram.com/diarioelimpacto" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Instagram de Diario Impacto"
              className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all group"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-white group-hover:scale-110 transition-transform"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

          </div>
        </div>

        {/* Navegación Rápida */}
        <div>
          <h3 className="text-white font-black mb-6 uppercase text-xs tracking-[0.3em] border-b border-slate-800 pb-2">Secciones</h3>
          <ul className="grid grid-cols-1 gap-3 text-sm font-bold">
            <li><Link to="/?categoria=Sociedad" className="hover:text-orange-500 transition-colors">SOCIEDAD</Link></li>
            <li><Link to="/?categoria=Deportes" className="hover:text-orange-500 transition-colors">DEPORTES</Link></li>
            <li><Link to="/?categoria=Sucesos" className="hover:text-orange-500 transition-colors">SUCESOS</Link></li>
            <li><Link to="/?categoria=Turismo" className="hover:text-orange-500 transition-colors">TURISMO</Link></li>
            <li><Link to="/?categoria=Villa Carlos Paz" className="hover:text-orange-500 transition-colors">VILLA CARLOS PAZ</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-white font-black mb-6 uppercase text-xs tracking-[0.3em] border-b border-slate-800 pb-2">Redacción</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-start gap-3">
              <span className="text-orange-500">📍</span> 
              <span>Villa Carlos Paz, Córdoba, Argentina.</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-orange-500">✉️</span> 
              <span className="hover:text-orange-400 cursor-pointer">contacto@diarioelimpacto.com</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        <p>© {new Date().getFullYear()} DIARIO IMPACTO — TODOS LOS DERECHOS RESERVADOS</p>
        <p className="text-orange-600">Desarrollado en Punilla</p>
      </div>
    </footer>
  );
}