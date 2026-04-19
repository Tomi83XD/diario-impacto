import { Link } from 'react-router-dom';

// Le sumamos la prop "urgente"
export default function NoticiaCard({ id, categoria, titulo, bajada, imagen, urgente }) {
  return (
    <Link to={`/noticia/${id}`} className="group relative h-[300px] w-full overflow-hidden rounded-sm block shadow-sm">
      <img src={imagen} alt={titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-300 group-hover:from-black"></div>
      
      <div className="absolute bottom-0 p-4 text-white w-full">
        <div className="flex items-center mb-2">
          {/* Si es urgente, mostramos el punto rojo animado */}
          {urgente && (
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#cc0000] px-2 py-1 inline-block rounded-sm">
            {categoria}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-tight mb-1 font-serif group-hover:text-gray-200">
          {titulo}
        </h3>
        {bajada && <p className="text-xs text-gray-300 line-clamp-2 mt-2 font-sans">{bajada}</p>}
      </div>
    </Link>
  );
}