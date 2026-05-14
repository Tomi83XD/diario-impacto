import { Link } from 'react-router-dom';

export default function NoticiaCard({ noticia, variante = 'normal' }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        ...(variante !== 'lista' && { hour: '2-digit', minute: '2-digit' })
      });
    }
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      ...(variante !== 'lista' && { hour: '2-digit', minute: '2-digit' })
    });
  };

  const esGrande = variante === 'grande';
  const esDestacada = variante === 'destacada';
  const esLista = variante === 'lista';
  const imagen = noticia.imagenPrincipal || noticia.imagen;

  if (esLista) {
    return (
      <Link 
        to={`/noticia/${noticia.id}`}
        className="group flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        {imagen && (
          <img
            src={imagen}
            alt={noticia.titulo}
            loading="lazy"
            className="w-20 h-16 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-orange-600 font-bold uppercase">
            {noticia.categoria}
          </span>
          <h4 className="text-sm font-medium text-slate-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors line-clamp-2 leading-tight">
            {noticia.titulo}
          </h4>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatearFecha(noticia.fechaPublicacion || noticia.fecha)}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/noticia/${noticia.id}`}
      className={`group block bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 ${
        esGrande ? 'h-full' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${esGrande ? 'aspect-[16/9]' : 'aspect-video'}`}>
        {imagen ? (
          <img
            src={imagen}
            alt={noticia.titulo}
            loading={esGrande ? "eager" : "lazy"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-4xl">📰</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {noticia.urgente && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded animate-pulse shadow-sm">
              🔴 Último Momento
            </span>
          )}
          {noticia.destacado && !noticia.urgente && (
            <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 uppercase rounded shadow-sm">
              ⭐ Destacada
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded shadow-sm ${
            esDestacada ? 'bg-white text-slate-900' : 'bg-orange-600 text-white'
          }`}>
            {noticia.categoria}
          </span>
        </div>
      </div>

      <div className={`p-4 ${esGrande ? 'md:p-6' : ''}`}>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1">
            <span>👤</span> {noticia.autor || 'Redacción'}
          </span>
          <span>•</span>
          <span>{formatearFecha(noticia.fechaPublicacion || noticia.fecha)}</span>
        </div>

        <h3 className={`font-bold text-slate-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors leading-tight ${
          esGrande ? 'text-xl md:text-2xl font-serif' : 
          esDestacada ? 'text-lg font-serif' : 
          'text-base font-serif line-clamp-2'
        }`}>
          {noticia.titulo}
        </h3>

        {(esGrande || esDestacada) && (
          <p className={`text-gray-600 dark:text-gray-300 mt-2 ${esGrande ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
            {noticia.bajada}
          </p>
        )}
      </div>
    </Link>
  );
}