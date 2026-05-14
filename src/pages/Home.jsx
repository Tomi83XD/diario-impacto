import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';

import NoticiaCard from '../components/NoticiaCard';
import SkeletonCard from '../components/SkeletonCard';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [masLeidas, setMasLeidas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoriaActiva = queryParams.get('categoria') || 'todas';

  const NOTICIAS_POR_PAGINA = 15;

  const obtenerNoticias = async (esCargaInicial = true) => {
    try {
      if (esCargaInicial) {
        setCargando(true);
        setNoticias([]);
      } else {
        setCargandoMas(true);
      }
      setError(null);
      
      let restricciones = [];
      
      if (categoriaActiva !== 'todas') {
        restricciones.push(where('categoria', '==', categoriaActiva));
        restricciones.push(limit(50)); // Traemos hasta 50 sin orderBy para evitar error de índice compuesto
      } else {
        restricciones.push(orderBy('fecha', 'desc'));
        restricciones.push(limit(NOTICIAS_POR_PAGINA));
        
        if (!esCargaInicial && ultimoDoc) {
          restricciones.push(startAfter(ultimoDoc));
        }
      }
      
      const q = query(collection(db, 'noticias'), ...restricciones);
      const querySnapshot = await getDocs(q);
      
      let noticiasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (categoriaActiva !== 'todas') {
        // Ordenamos en el cliente para no requerir índice compuesto en Firebase
        noticiasData.sort((a, b) => {
          const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
          const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
          return dateB - dateA;
        });
        setHayMas(false);
      } else {
        setUltimoDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHayMas(querySnapshot.docs.length === NOTICIAS_POR_PAGINA);
      }
      
      if (esCargaInicial) {
        setNoticias(noticiasData);
        if (categoriaActiva === 'todas') {
           const masLeidasQuery = query(collection(db, 'noticias'), orderBy('visitas', 'desc'), limit(5));
           const masLeidasSnap = await getDocs(masLeidasQuery);
           setMasLeidas(masLeidasSnap.docs.map(d => ({id: d.id, ...d.data()})));
        }
      } else {
        setNoticias(prev => [...prev, ...noticiasData]);
      }

    } catch (error) {
      console.error("Error al traer noticias:", error);
      setError('Error al cargar las noticias. Intentá recargar la página.');
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  };

  useEffect(() => {
    obtenerNoticias(true);
  }, [categoriaActiva]);

  const noticiasDestacadas = noticias.filter(n => n.destacado === true).slice(0, 3);
  const ultimoMomento = noticias.filter(n => n.urgente === true).slice(0, 5);
  
  const principal = noticias[0];
  const secundarias = noticias.slice(1, 5);
  const restantes = noticias.slice(5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {ultimoMomento.length > 0 && !cargando && (
        <div className="bg-red-600 text-white py-2 overflow-hidden border-b border-red-700">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
            <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded uppercase flex-shrink-0 z-10 shadow-sm">
              🔴 Último Momento
            </span>
            <div className="flex-1 overflow-hidden relative">
              <motion.div 
                className="flex gap-12 whitespace-nowrap"
                animate={{ x: ['0%', '-100%'] }}
                transition={{ 
                  duration: 40,
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
              >
                {[...ultimoMomento, ...ultimoMomento, ...ultimoMomento, ...ultimoMomento].map((noticia, i) => (
                  <Link 
                    key={`${noticia.id}-${i}`}
                    to={`/noticia/${noticia.id}`}
                    className="text-sm font-bold hover:underline inline-flex items-center"
                  >
                    <span className="mr-4">|</span> {noticia.titulo}
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}    

      <main className="max-w-7xl mx-auto px-4 py-8">

        {categoriaActiva !== 'todas' && (
          <div className="mb-6">
            <h1 className="text-3xl font-black font-serif text-slate-900 dark:text-gray-100 border-l-4 border-orange-600 pl-4">
              Noticias de {categoriaActiva}
            </h1>
          </div>
        )}

        {cargando ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SkeletonCard variante="grande" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
            <div className="space-y-4">
              <SkeletonCard variante="lista" />
              <SkeletonCard variante="lista" />
              <SkeletonCard variante="lista" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-lg text-center border border-red-200 dark:border-red-900 mb-8">
            <p className="text-red-500 text-lg mb-2">{error}</p>
          </div>
        ) : noticias.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-lg text-center border border-gray-200 dark:border-gray-700 mb-8">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No se encontraron noticias.</p>
          </div>
        ) : (
          <>
            {noticiasDestacadas.length > 0 && categoriaActiva === 'todas' && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 uppercase tracking-tight">Noticias Destacadas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {noticiasDestacadas.map((noticia, index) => (
                    <motion.div key={noticia.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <NoticiaCard noticia={noticia} variante="destacada" />
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
                      <NoticiaCard noticia={principal} variante="grande" />
                    </motion.div>
                  </section>
                )}

                {secundarias.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center justify-between mb-4 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 uppercase tracking-tight border-b-4 border-orange-600 inline-block pb-2 -mb-[10px]">
                        Últimas Noticias
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {secundarias.map((noticia, index) => (
                        <motion.div key={noticia.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                          <NoticiaCard noticia={noticia} variante="normal" />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {restantes.length > 0 && (
                  <section>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 uppercase tracking-tight border-b-2 border-gray-200 dark:border-gray-700 pb-2 mb-4">
                      Más Noticias
                    </h2>
                    <div className="space-y-4">
                      {restantes.map((noticia, index) => (
                        <motion.div key={noticia.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                          <NoticiaCard noticia={noticia} variante="lista" />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {hayMas && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => obtenerNoticias(false)}
                      disabled={cargandoMas}
                      className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {cargandoMas ? 'Cargando...' : 'Cargar más noticias'}
                    </button>
                  </div>
                )}
              </div>

              <aside className="w-full lg:w-[32%] space-y-6">
                {masLeidas.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-slate-900 dark:bg-black text-white p-4">
                      <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">🔥 Más Leídas</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {masLeidas.map((noticia) => (
                        <div key={noticia.id}>
                          <NoticiaCard noticia={noticia} variante="lista" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}