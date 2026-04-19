import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

        {(noticia.galeriaImagenes?.length > 0 || noticia.videoUrl) && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {noticia.videoUrl ? '🎥' : '📷'} {noticia.galeriaImagenes?.length > 0 ? noticia.galeriaImagenes.length + 1 : 1}
          </div>
        )}
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

        {noticia.tags && noticia.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {noticia.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
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
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  
  // ESTADOS NUEVOS
  const [nivelDique, setNivelDique] = useState({ nivel: '--', estado: 'Actualizando...' });
  const [climaHome, setClimaHome] = useState({
    temp: '--',
    estado: 'Cargando...',
    max: '--',
    min: '--',
    humedad: '--',
    viento: '--',
    icon: '⛅'
  });

  const categorias = ['todas', 'Sociedad', 'Deportes', 'Sucesos', 'Política', 'Economía', 'Turismo', 'Villa Carlos Paz', 'Cultura'];

  // EFECTO 1: Cargar Noticias
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

  // EFECTO 2: Filtrar por categoría
  useEffect(() => {
    if (categoriaActiva === 'todas') {
      setNoticias(todasLasNoticias);
    } else {
      const filtradas = todasLasNoticias.filter(n => n.categoria === categoriaActiva);
      setNoticias(filtradas);
    }
  }, [categoriaActiva, todasLasNoticias]);

  // EFECTO 3: Automatización Nivel del Dique
  useEffect(() => {
    const obtenerNivelDique = async () => {
      try {
        const urlOficial = 'https://www.cba.gov.ar/nivel-de-diques-y-embalses/';
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urlOficial)}`);
        const data = await response.json();
        
        const regex = /San Roque.*?(\d{2},\d{2})/s;
        const match = data.contents.match(regex);
        
        if (match && match[1]) {
          const nivelCalculado = match[1].replace(',', '.');
          const esAlto = parseFloat(nivelCalculado) >= 35.30;
          
          setNivelDique({
            nivel: nivelCalculado,
            estado: esAlto ? 'Superando el embudo ⚠️' : 'Normal'
          });
        }
      } catch (error) {
        console.error("Error al buscar el nivel del dique:", error);
        setNivelDique({ nivel: '35.30', estado: 'Error de lectura' });
      }
    };

    obtenerNivelDique();
    const intervalo = setInterval(obtenerNivelDique, 7200000); // 2 horas
    return () => clearInterval(intervalo);
  }, []);

  // EFECTO 4: Clima en tiempo real para el Home
  useEffect(() => {
    const obtenerClimaHome = async () => {
      try {
        const lat = -31.42;
        const lon = -64.50;
        // Pedimos datos actuales y el pronóstico diario para sacar máx/mín
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`
        );
        const data = await response.json();

        // Interpretación básica de los códigos de clima de la API (WMO code)
        let descripcionEstado = 'Despejado';
        let iconoActual = '☀️';
        const code = data.current.weather_code;
        
        if (code >= 1 && code <= 3) { descripcionEstado = 'Parcialmente nublado'; iconoActual = '⛅'; }
        if (code >= 45 && code <= 48) { descripcionEstado = 'Niebla'; iconoActual = '🌫️'; }
        if (code >= 51 && code <= 67) { descripcionEstado = 'Llovizna'; iconoActual = '🌧️'; }
        if (code >= 71 && code <= 82) { descripcionEstado = 'Lluvia'; iconoActual = '🌧️'; }
        if (code >= 95) { descripcionEstado = 'Tormenta'; iconoActual = '⛈️'; }

        setClimaHome({
          temp: Math.round(data.current.temperature_2m),
          estado: descripcionEstado,
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          humedad: data.current.relative_humidity_2m,
          viento: Math.round(data.current.wind_speed_10m),
          icon: iconoActual
        });

      } catch (error) {
        console.error("Error al cargar el clima del Home:", error);
      }
    };

    obtenerClimaHome();
    const climaTimer = setInterval(obtenerClimaHome, 1800000); // Cada 30 mins
    return () => clearInterval(climaTimer);
  }, []);


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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Recargar página
        </button>
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
                  <Link 
                    key={`${noticia.id}-${i}`}
                    to={`/noticia/${noticia.id}`}
                    className="text-sm hover:underline"
                  >
                    {noticia.titulo}
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      )}


      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 no-scrollbar">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat === 'todas' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {noticias.length === 0 && (
          <div className="bg-white p-12 rounded-lg text-center border border-gray-200 mb-8">
            <p className="text-gray-500 text-lg mb-2">No hay noticias publicadas todavía.</p>
            <p className="text-gray-400 text-sm">Creá la primera noticia desde el panel de administración.</p>
            <Link 
              to="/admin" 
              className="inline-block mt-4 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Ir al Panel Admin
            </Link>
          </div>
        )}

        {noticiasDestacadas.length > 0 && categoriaActiva === 'todas' && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⭐</span>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                Noticias Destacadas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {noticiasDestacadas.map((noticia, index) => (
                <motion.div
                  key={noticia.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
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
                    <motion.div
                      key={noticia.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
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
                    <motion.div
                      key={noticia.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link 
                        to={`/noticia/${noticia.id}`}
                        className="group flex gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all"
                      >
                        {(noticia.imagenPrincipal || noticia.imagen) && (
                          <img
                            src={noticia.imagenPrincipal || noticia.imagen}
                            alt={noticia.titulo}
                            className="w-32 h-24 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-orange-600 uppercase">
                              {noticia.categoria}
                            </span>
                            {noticia.urgente && (
                              <span className="text-xs text-red-600">🔴</span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {noticia.titulo}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {noticia.bajada}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>👤 {noticia.autor || 'Redacción'}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-[32%] space-y-6">
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>💧</span> Nivel del Dique San Roque
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{nivelDique.nivel}</span>
                <span className="text-blue-200">mts</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-400">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Cota del embudo:</span>
                  <span className="font-bold">35.30 mts</span>
                </div>
                <div className="mt-2 bg-blue-400/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${parseFloat(nivelDique.nivel) >= 35.30 ? 'bg-red-400 animate-pulse' : 'bg-white'}`}
                    style={{ width: nivelDique.nivel !== '--' ? `${Math.min((parseFloat(nivelDique.nivel) / 35.30) * 100, 100)}%` : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-blue-100 mt-2 font-medium">Estado: {nivelDique.estado}</p>
              </div>
            </div>

            {masLeidas.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-4">
                  <h3 className="font-bold uppercase tracking-wide text-sm flex items-center gap-2">
                    <span>🔥</span> Más Leídas
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {masLeidas.map((noticia, index) => (
                    <div key={noticia.id} className="relative">
                      <span className="absolute left-2 top-3 text-2xl font-black text-gray-100">
                        {index + 1}
                      </span>
                      <NoticiaLista noticia={noticia} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET CLIMA ACTUALIZADO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>🌤️</span> Clima en Villa Carlos Paz
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-slate-900">{climaHome.temp}°</p>
                  <p className="text-gray-500 text-sm">{climaHome.estado}</p>
                  <p className="text-gray-400 text-xs mt-1">Máx: {climaHome.max}° | Mín: {climaHome.min}°</p>
                </div>
                <div className="text-5xl">{climaHome.icon}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-gray-400">Humedad</p>
                  <p className="font-bold">{climaHome.humedad}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Viento</p>
                  <p className="font-bold">{climaHome.viento} km/h</p>
                </div>
                <div>
                  <p className="text-gray-400">UV</p>
                  <p className="font-bold">Alto</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
              <h3 className="font-bold text-orange-900 mb-2">📧 Recibí las noticias</h3>
              <p className="text-sm text-orange-700 mb-3">
                Suscribite y recibí las noticias más importantes en tu email.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors">
                  Suscribir
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Seguinos</h3>
              <div className="flex gap-3">
                <a href="#" className="flex-1 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-bold">
                  f
                </a>
                <a href="#" className="flex-1 py-3 bg-sky-500 text-white text-center rounded-lg hover:bg-sky-600 transition-colors font-bold">
                  X
                </a>
                <a href="#" className="flex-1 py-3 bg-pink-600 text-white text-center rounded-lg hover:bg-pink-700 transition-colors font-bold">
                  IG
                </a>
                <a href="#" className="flex-1 py-3 bg-green-500 text-white text-center rounded-lg hover:bg-green-600 transition-colors font-bold">
                  W
                </a>
              </div>
            </div>

          </aside>
        </div>
      </main>

      <footer className="bg-slate-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-2xl font-black font-serif mb-4">
                DIARIO <span className="text-orange-500">IMPACTO</span>
              </h4>
              <p className="text-gray-400 text-sm">
                Información verificada desde Villa Carlos Paz y el Valle de Punilla.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-3">Secciones</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-orange-400">Inicio</Link></li>
                <li><Link to="/" className="hover:text-orange-400">Sociedad</Link></li>
                <li><Link to="/" className="hover:text-orange-400">Deportes</Link></li>
                <li><Link to="/" className="hover:text-orange-400">Sucesos</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-3">Contacto</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📧 redaccion@diarioimpacto.com</li>
                <li>📞 (03541) 123456</li>
                <li>📍 Villa Carlos Paz, Córdoba</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-3">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-orange-400">Términos de uso</Link></li>
                <li><Link to="/" className="hover:text-orange-400">Política de privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Diario Impacto. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}