import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';

export default function DetalleNoticia() {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  
  // Estados para Likes y Zoom
  const [likes, setLikes] = useState(0);
  const [yaDioLike, setYaDioLike] = useState(false); // NUEVO ESTADO PARA FRENAR EL SPAM
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => {
    // Revisamos si este usuario ya le dio like a esta noticia antes (buscando en localStorage)
    const likesGuardados = JSON.parse(localStorage.getItem('likes_noticias')) || [];
    if (likesGuardados.includes(id)) {
      setYaDioLike(true);
    }

    const obtenerNoticia = async () => {
      try {
        setCargando(true);
        setError(null);
        
        const docRef = doc(db, 'noticias', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNoticia(data);
          setLikes(data.likes || 0);
          
          // Incrementar contador de visitas
          try {
            await updateDoc(docRef, { visitas: increment(1) });
          } catch (e) {
            console.log('No se pudo incrementar visitas');
          }
        } else {
          setError('La noticia no existe o fue eliminada.');
        }
      } catch (error) {
        console.error("Error al obtener noticia:", error);
        setError('Error al cargar la noticia: ' + error.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerNoticia();
  }, [id]);

  // Función para dar Like MEJORADA
  const manejarLike = async () => {
    // Si ya dio like, cortamos la función acá para que no sume más
    if (yaDioLike) return;

    const docRef = doc(db, 'noticias', id);
    try {
      await updateDoc(docRef, { likes: increment(1) });
      setLikes(prev => prev + 1);
      setYaDioLike(true); // Bloqueamos el botón en la pantalla

      // Guardamos en el navegador que ya le gustó esta noticia
      const likesGuardados = JSON.parse(localStorage.getItem('likes_noticias')) || [];
      localStorage.setItem('likes_noticias', JSON.stringify([...likesGuardados, id]));
    } catch (e) {
      console.error("Error al dar like");
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extraer ID de video de YouTube
  const obtenerVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
        <Link to="/" className="text-orange-600 underline">Volver al inicio</Link>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold">La noticia no existe.</h2>
        <Link to="/" className="text-orange-600 underline mt-4 block">Volver al inicio</Link>
      </div>
    );
  }

  // Preparar todas las imágenes
  const imagenPrincipal = noticia.imagenPrincipal || noticia.imagen;
  const todasLasImagenes = [
    imagenPrincipal,
    ...(noticia.galeriaImagenes || [])
  ].filter(img => img && img.trim() !== '');

  const videoId = obtenerVideoId(noticia.videoUrl);

  return (
    <article className="min-h-screen bg-white">
      
      <Helmet>
        <title>{noticia.titulo} | Diario Impacto</title>
        <meta name="description" content={noticia.metaDescripcion || noticia.bajada} />
        <meta property="og:title" content={noticia.titulo} />
        <meta property="og:description" content={noticia.metaDescripcion || noticia.bajada} />
        <meta property="og:image" content={imagenPrincipal} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Barra superior */}
      <div className="bg-slate-900 text-white py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium hover:text-orange-400 transition-colors">
            ← Volver al inicio
          </Link>
          <span className="text-xs text-gray-400">
            {formatearFecha(noticia.fechaPublicacion || noticia.fecha)}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 font-sans">

        {/* Encabezado */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 uppercase rounded-sm">
              {noticia.categoria}
            </span>
            {noticia.urgente && (
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase rounded-sm animate-pulse">
                🔴 Último momento
              </span>
            )}
            {noticia.destacado && !noticia.urgente && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 uppercase rounded-sm">
                ⭐ Destacada
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight font-serif mb-4">
            {noticia.titulo}
          </h1>
          
          <p className="text-xl text-gray-600 font-medium leading-relaxed font-sans border-l-4 border-orange-500 pl-4 py-2 italic">
            {noticia.bajada}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                {(noticia.autor || 'R').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium text-slate-700">{noticia.autor || 'Redacción'}</p>
                {noticia.fuente && (
                  <p className="text-xs">Fuente: {noticia.fuente}</p>
                )}
              </div>
            </div>
            <span className="hidden md:inline text-gray-300">|</span>
            <div>
              <p>Publicado el {formatearFecha(noticia.fechaPublicacion || noticia.fecha)}</p>
            </div>
            <span className="hidden md:inline text-gray-300">|</span>
            
            {/* BOTÓN DE LIKES Y VISITAS */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1" title="Visitas">
                👁 {noticia.visitas || 0}
              </span>
              <button 
                onClick={manejarLike}
                disabled={yaDioLike}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors border ${
                  yaDioLike 
                    ? 'bg-red-600 text-white border-red-600 cursor-default shadow-md' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                }`}
                title={yaDioLike ? "Ya reaccionaste a esta noticia" : "Me gusta"}
              >
                ❤️ <span className="font-bold">{likes}</span>
              </button>
            </div>

          </div>
        </header>

        {/* Imagen Principal / Galería */}
        {todasLasImagenes.length > 0 && (
          <figure className="mb-10">
            <div className="relative">
              <img 
                src={todasLasImagenes[imagenActiva]} 
                alt={noticia.titulo} 
                className="w-full aspect-video object-cover rounded-lg shadow-lg cursor-zoom-in"
                onClick={() => setModalImagen(todasLasImagenes[imagenActiva])}
              />
              {todasLasImagenes.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm pointer-events-none">
                  {imagenActiva + 1} / {todasLasImagenes.length}
                </div>
              )}
            </div>
            
            {todasLasImagenes.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {todasLasImagenes.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImagenActiva(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      imagenActiva === index 
                        ? 'border-orange-600 ring-2 ring-orange-200' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </figure>
        )}

        {/* Video de YouTube */}
        {videoId && (
          <div className="mb-10">
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Video de la noticia"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Cuerpo de la Noticia */}
        <div 
          className="prose prose-lg max-w-none text-slate-800 leading-loose font-serif whitespace-pre-wrap mb-10"
          dangerouslySetInnerHTML={{ __html: noticia.cuerpo }}
        />

        {/* Tags */}
        {noticia.tags && noticia.tags.length > 0 && (
          <div className="mb-10">
            <p className="text-sm text-gray-500 mb-2">Etiquetas:</p>
            <div className="flex flex-wrap gap-2">
              {noticia.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/?tag=${tag.toLowerCase()}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-orange-100 hover:text-orange-700 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        <hr className="my-12 border-gray-200" />

        {/* Firma/Créditos */}
        <div className="bg-slate-50 p-6 border-t-4 border-orange-500 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                {noticia.autor || 'Redacción Diario Impacto'}
              </p>
              {noticia.fuente && (
                <p className="text-xs text-gray-500 mt-1">
                  Fuente: {noticia.fuente}
                </p>
              )}
              <p className="text-xs text-gray-400 italic mt-1">
                Publicado el {formatearFecha(noticia.fechaPublicacion || noticia.fecha)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Compartir:</span>
              <button 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                f
              </button>
              <button 
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(noticia.titulo)}`, '_blank')}
                className="w-8 h-8 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
              >
                X
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' ' + window.location.href)}`, '_blank')}
                className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                W
              </button>
            </div>
          </div>
        </div>

        {/* Noticias relacionadas */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-900 mb-4 font-serif">
            Noticias relacionadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Link 
                key={i}
                to="/"
                className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4">
                  <span className="text-xs text-orange-600 font-bold uppercase">
                    {noticia.categoria}
                  </span>
                  <p className="text-sm font-medium text-slate-900 mt-1 group-hover:text-orange-600 transition-colors">
                    Ver más noticias de {noticia.categoria}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* LIGHTBOX MODAL */}
      {modalImagen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setModalImagen(null)}
        >
          <img src={modalImagen} alt="Ampliación" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain" />
          <button className="absolute top-5 right-5 text-white text-4xl font-bold hover:text-gray-300">
            &times;
          </button>
        </div>
      )}

    </article>
  );
}