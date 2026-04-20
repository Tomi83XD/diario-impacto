import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Componente de tarjeta de noticia
function NoticiaCard({ noticia, tamaño = 'normal' }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const esGrande = tamaño === 'grande';
  const esDestacada = tamaño === 'destacada';

  const imagen = noticia.imagenPrincipal || noticia.imagen;

  return (
    <Link 
      to={`/noticia/${noticia.id}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 ${
        esGrande ? 'h-full' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${esGrande ? 'aspect-[16/9]' : 'aspect-video'}`}>
        {imagen ? (
          <img
            src={imagen}
            alt={noticia.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-4xl">📰</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {noticia.urgente && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded animate-pulse">
              🔴 Último Momento
            </span>
          )}
          {noticia.destacado && !noticia.urgente && (
            <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 uppercase rounded">
              ⭐ Destacada
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded ${
            esDestacada ? 'bg-white text-slate-900' : 'bg-orange-600 text-white'
          }`}>
            {noticia.categoria}
          </span>
        </div>
      </div>

      <div className={`p-4 ${esGrande ? 'md:p-6' : ''}`}>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <span>👤</span> {noticia.autor || 'Redacción'}
          </span>
          <span>•</span>
          <span>{formatearFecha(noticia.fechaPublicacion || noticia.fecha)}</span>
        </div>

        <h3 className={`font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-tight ${
          esGrande ? 'text-xl md:text-2xl font-serif' : 
          esDestacada ? 'text-lg font-serif' : 
          'text-base font-serif line-clamp-2'
        }`}>
          {noticia.titulo}
        </h3>

        {(esGrande || esDestacada) && (
          <p className={`text-gray-600 mt-2 ${esGrande ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
            {noticia.bajada}
          </p>
        )}
      </div>
    </Link>
  );
}

// Componente de noticia lista (para sidebar)
function NoticiaLista({ noticia }) {
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short'
      });
    }
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const imagen = noticia.imagenPrincipal || noticia.imagen;

  return (
    <Link 
      to={`/noticia/${noticia.id}`}
      className="group flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      {imagen && (
        <img
          src={imagen}
          alt={noticia.titulo}
          className="w-20 h-16 object-cover rounded flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-orange-600 font-bold uppercase">
          {noticia.categoria}
        </span>
        <h4 className="text-sm font-medium text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
          {noticia.titulo}
        </h4>
        <span className="text-xs text-gray-400">{formatearFecha(noticia.fechaPublicacion || noticia.fecha)}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [todasLasNoticias, setTodasLasNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Leemos la URL (ej: /?categoria=Deportes) para saber qué filtrar
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoriaActiva = queryParams.get('categoria') || 'todas';

  // EFECTO 1: Cargar Noticias (solo se ejecuta 1 vez)
  useEffect(() => {
    const obtenerNoticias = async () => {
      try {
        setCargando(true);
        setError(null);
        
        const q = query(
          collection(db, 'noticias'),
          orderBy('fecha', 'desc'),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const noticiasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTodasLasNoticias(noticiasData);
        setNoticias(noticiasData);

      } catch (error) {
        console.error("Error al traer noticias:", error);
        setError('Error al cargar las noticias. Intentá recargar la página.');
      } finally {
        setCargando(false);
      }
    };

    obtenerNoticias();
  }, []);

  // EFECTO 2: Filtrado dinámico
  useEffect(() => {
    if (categoriaActiva === 'todas') {
      setNoticias(todasLasNoticias);
    } else {
      const filtradas = todasLasNoticias.filter(n => n.categoria === categoriaActiva);
      setNoticias(filtradas);
    }
  }, [categoriaActiva, todasLasNoticias]);

  const noticiasDestacadas = todasLasNoticias.filter(n => n.destacado === true).slice(0, 3);
  const ultimoMomento = todasLasNoticias.filter(n => n.urgente === true).slice(0, 5);
  
  const principal = noticias[0];
  const secundarias = noticias.slice(1, 5);
  const restantes = noticias.slice(5);
  const masLeidas = [...todasLasNoticias].sort((a, b) => (b.visitas || 0) - (a.visitas || 0)).slice(0, 5);

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Cargando noticias...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {ultimoMomento.length > 0 && (
        <div className="bg-red-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 overflow-hidden">
            <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded uppercase flex-shrink-0">
              🔴 Último Momento
            </span>
            <div className="flex-1 overflow-hidden">
              <motion.div 
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              >
                {[...ultimoMomento, ...ultimoMomento].map((noticia, i) => (
                  <Link key={`${noticia.id}-${i}`} to={`/noticia/${noticia.id}`} className="text-sm hover:underline">
                    {noticia.titulo}
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Título de categoría dinámica */}
        {categoriaActiva !== 'todas' && (
          <div className="mb-6">
            <h1 className="text-3xl font-black font-serif text-slate-900 border-l-4 border-orange-600 pl-4">
              Noticias de {categoriaActiva}
            </h1>
          </div>
        )}

        {noticias.length === 0 && (
          <div className="bg-white p-12 rounded-lg text-center border border-gray-200 mb-8">
            <p className="text-gray-500 text-lg mb-2">No hay noticias en esta sección todavía.</p>
          </div>
        )}

        {noticiasDestacadas.length > 0 && categoriaActiva === 'todas' && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⭐</span>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Noticias Destacadas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {noticiasDestacadas.map((noticia, index) => (
                <motion.div key={noticia.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <NoticiaCard noticia={noticia} tamaño="destacada" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[68%]">
            
            {principal && (
              <section className="mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <NoticiaCard noticia={principal} tamaño="grande" />
                </motion.div>
              </section>
            )}

            {secundarias.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4 border-b-2 border-gray-200 pb-2">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight border-b-4 border-orange-600 inline-block pb-2 -mb-[10px]">
                    Últimas Noticias
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {secundarias.map((noticia, index) => (
                    <motion.div key={noticia.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <NoticiaCard noticia={noticia} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {restantes.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight border-b-2 border-gray-200 pb-2 mb-4">
                  Más Noticias
                </h2>
                <div className="space-y-4">
                  {restantes.map((noticia, index) => (
                    <motion.div key={noticia.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                      <Link to={`/noticia/${noticia.id}`} className="group flex gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all">
                        {(noticia.imagenPrincipal || noticia.imagen) && (
                          <img src={noticia.imagenPrincipal || noticia.imagen} alt={noticia.titulo} className="w-32 h-24 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-orange-600 uppercase">{noticia.categoria}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">{noticia.titulo}</h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-[32%] space-y-6">

            {masLeidas.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-4">
                  <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">🔥 Más Leídas</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {masLeidas.map((noticia) => (
                    <div key={noticia.id}>
                      <NoticiaLista noticia={noticia} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>
      </main>

    </div>
  );
}