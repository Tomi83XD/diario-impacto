import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../config/firebase';
// Agregamos collection, query, where, limit y getDocs para buscar las relacionadas
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';

export default function DetalleNoticia() {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  
  // ESTADO NUEVO: Para guardar las noticias relacionadas
  const [relacionadas, setRelacionadas] = useState([]);
  
  // Estados para Likes y Zoom
  const [likes, setLikes] = useState(0);
  const [yaDioLike, setYaDioLike] = useState(false);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => {
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

          // BUSCAR NOTICIAS RELACIONADAS DE LA MISMA CATEGORÍA
          try {
            const qRelacionadas = query(
              collection(db, 'noticias'),
              where('categoria', '==', data.categoria),
              limit(4) // Traemos 4 por si una es la misma que estamos leyendo
            );
            
            const relSnap = await getDocs(qRelacionadas);
            const relData = relSnap.docs
              .map(docItem => ({ id: docItem.id, ...docItem.data() }))
              .filter(n => n.id !== id) // Filtramos para que no salga la noticia actual
              .slice(0, 3); // Nos quedamos solo con 3
            
            setRelacionadas(relData);
          } catch (errorRel) {
            console.log("Error al cargar relacionadas", errorRel);
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

  const manejarLike = async () => {
    if (yaDioLike) return;

    const docRef = doc(db, 'noticias', id);
    try {
      await updateDoc(docRef, { likes: increment(1) });
      setLikes(prev => prev + 1);
      setYaDioLike(true); 

      const likesGuardados = JSON.parse(localStorage.getItem('likes_noticias')) || [];
      localStorage.setItem('likes_noticias', JSON.stringify([...likesGuardados, id]));
    } catch (e) {
      console.error("Error al dar like");
    }
  };

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

  const imagenPrincipal = noticia.imagenPrincipal || noticia.imagen;
  const todasLasImagenes = [
    imagenPrincipal,
    ...(noticia.galeriaImagenes || [])
  ].filter(img => img && img.trim() !== '');

  const videoId = obtenerVideoId(noticia.videoUrl);

  return (
    <article className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      
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
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-gray-100 leading-tight font-serif mb-4">
            {noticia.titulo}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed font-sans border-l-4 border-orange-500 pl-4 py-2 italic">
            {noticia.bajada}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                {(noticia.autor || 'R').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-medium text-slate-700 dark:text-gray-200">{noticia.autor || 'Redacción'}</p>
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
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/50'
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
                      loading="lazy"
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
          className="prose prose-lg max-w-none text-slate-800 dark:text-gray-200 leading-loose font-serif whitespace-pre-wrap mb-10 prose-a:text-orange-600 hover:prose-a:text-orange-500"
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
                  className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        <hr className="my-12 border-gray-200 dark:border-gray-800" />

        {/* Firma/Créditos */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t-4 border-orange-500 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-gray-100 uppercase tracking-tight">
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
              
              {/* BOTÓN FACEBOOK (Lleva al perfil) */}
              <button 
                onClick={() => window.open('https://www.facebook.com/profile.php?id=61575839683505', '_blank')}
                className="w-8 h-8 bg-[#1877F2] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="Visitar nuestro Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* BOTÓN X / TWITTER (Comparte la noticia) */}
              <button 
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(noticia.titulo)}`, '_blank')}
                className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                title="Compartir en X"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>

              {/* BOTÓN WHATSAPP (Comparte la noticia) */}
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' - ' + window.location.href)}`, '_blank')}
                className="w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Compartir por WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* NOTICIAS RELACIONADAS REALES */}
        {relacionadas.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-6 font-serif">
              Noticias relacionadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relacionadas.map((rel) => (
                <Link 
                  key={rel.id}
                  to={`/noticia/${rel.id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group block bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
                >
                  <div className="aspect-video overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {rel.imagenPrincipal || rel.imagen ? (
                      <img 
                        src={rel.imagenPrincipal || rel.imagen} 
                        alt={rel.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📰</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                      {rel.categoria}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-gray-100 mt-1 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors line-clamp-2">
                      {rel.titulo}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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