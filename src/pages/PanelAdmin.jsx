import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

export default function AdminPanel() {
  // === MODO VISTA ===
  const [vista, setVista] = useState('lista'); // lista, crear, editar
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  
  // === LISTADO DE NOTICIAS ===
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [noticiaEliminando, setNoticiaEliminando] = useState(null);

  // === ESTADOS DEL FORMULARIO ===
  const [titulo, setTitulo] = useState('');
  const [bajada, setBajada] = useState('');
  const [categoria, setCategoria] = useState('Sociedad');
  const [cuerpo, setCuerpo] = useState('');
  const [autor, setAutor] = useState('');
  const [fuente, setFuente] = useState('');

  // === ESTADOS DE MENSAJES DE CONTACTO ===
  const [mensajes, setMensajes] = useState([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  
  // === IMÁGENES ===
  const [imagenPrincipal, setImagenPrincipal] = useState('');
  const [imagenesAdicionales, setImagenesAdicionales] = useState(['']);
  
  // === FECHA Y HORA ===
  const [fechaPublicacion, setFechaPublicacion] = useState('');
  const [horaPublicacion, setHoraPublicacion] = useState('');
  const [publicarAhora, setPublicarAhora] = useState(true);
  
  // === CONFIGURACIÓN ===
  const [urgente, setUrgente] = useState(false);
  const [destacado, setDestacado] = useState(false);
  const [estado, setEstado] = useState('publicado');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  // === SEO ===
  const [metaDescripcion, setMetaDescripcion] = useState('');
  const [palabrasClave, setPalabrasClave] = useState('');
  
  // === VIDEO ===
  const [videoUrl, setVideoUrl] = useState('');
  
  // === UI ===
  const [mensaje, setMensaje] = useState('');
  const [activeTab, setActiveTab] = useState('contenido');

  // Cargar noticias al iniciar
  useEffect(() => {
    cargarNoticias();
  }, []);

  // Setear fecha/hora actual
  useEffect(() => {
    const now = new Date();
    setFechaPublicacion(now.toISOString().split('T')[0]);
    setHoraPublicacion(now.toTimeString().slice(0, 5));
  }, []);


  const cargarMensajes = async () => {
    setCargandoMensajes(true);
    try {
      const q = query(collection(db, 'mensajes'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      setMensajes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    } finally {
      setCargandoMensajes(false);
    }
  };

  // === MARCAR COMO LEÍDO ===
  const marcarMensajeLeido = async (id, estadoActual) => {
    try {
      await updateDoc(doc(db, 'mensajes', id), { leido: !estadoActual });
      setMensajes(mensajes.map(m => m.id === id ? { ...m, leido: !estadoActual } : m));
    } catch (error) {
      console.error("Error al marcar leído:", error);
    }
  };

  // === ELIMINAR MENSAJE ===
  const eliminarMensaje = async (id) => {
    if(!confirm('¿Borrar este mensaje para siempre?')) return;
    try {
      await deleteDoc(doc(db, 'mensajes', id));
      setMensajes(mensajes.filter(m => m.id !== id));
    } catch (error) {
      console.error("Error eliminando mensaje:", error);
    }
  };
  // === CARGAR NOTICIAS ===
  const cargarNoticias = async () => {
    setCargando(true);
    try {
      // Consulta simple sin filtros complejos
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
      
      setNoticias(noticiasData);
    } catch (error) {
      console.error("Error cargando noticias:", error);
      setMensaje('Error al cargar las noticias: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // === FILTRAR NOTICIAS (localmente) ===
  const noticiasFiltradas = noticias.filter(noticia => {
    const matchCategoria = filtroCategoria === 'todas' || noticia.categoria === filtroCategoria;
    const matchEstado = filtroEstado === 'todas' || (noticia.estado || 'publicado') === filtroEstado;
    const matchBusqueda = busqueda === '' || 
      noticia.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      noticia.autor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      noticia.tags?.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
    return matchCategoria && matchEstado && matchBusqueda;
  });

  // === FORMATEAR FECHA ===
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    if (fecha.toDate) {
      return fecha.toDate().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // === INICIAR EDICIÓN ===
  const iniciarEdicion = (noticia) => {
    setNoticiaEditando(noticia);
    setTitulo(noticia.titulo || '');
    setBajada(noticia.bajada || '');
    setCategoria(noticia.categoria || 'Sociedad');
    setCuerpo(noticia.cuerpo || '');
    setAutor(noticia.autor || '');
    setFuente(noticia.fuente || '');
    setImagenPrincipal(noticia.imagenPrincipal || noticia.imagen || '');
    setImagenesAdicionales(noticia.galeriaImagenes?.length > 0 ? noticia.galeriaImagenes : ['']);
    setUrgente(noticia.urgente || false);
    setDestacado(noticia.destacado || false);
    setEstado(noticia.estado || 'publicado');
    setTags(noticia.tags || []);
    setMetaDescripcion(noticia.metaDescripcion || '');
    setPalabrasClave(noticia.palabrasClave?.join(', ') || '');
    setVideoUrl(noticia.videoUrl || '');
    setPublicarAhora(true);
    setVista('editar');
    setActiveTab('contenido');
    window.scrollTo(0, 0);
  };

  // === ELIMINAR NOTICIA ===
  const eliminarNoticia = async (id) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta noticia? Esta acción no se puede deshacer.')) {
      return;
    }
    setNoticiaEliminando(id);
    try {
      await deleteDoc(doc(db, 'noticias', id));
      setNoticias(noticias.filter(n => n.id !== id));
      setMensaje('Noticia eliminada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error("Error eliminando:", error);
      setMensaje('Error al eliminar: ' + error.message);
    } finally {
      setNoticiaEliminando(null);
    }
  };

  // === CAMBIAR ESTADO RÁPIDO ===
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'noticias', id), { estado: nuevoEstado });
      setNoticias(noticias.map(n => n.id === id ? { ...n, estado: nuevoEstado } : n));
      setMensaje(`Estado cambiado a ${nuevoEstado}`);
      setTimeout(() => setMensaje(''), 2000);
    } catch (error) {
      console.error("Error cambiando estado:", error);
      setMensaje('Error: ' + error.message);
    }
  };

  // === FUNCIONES PARA IMÁGENES ===
  const agregarImagenAdicional = () => {
    setImagenesAdicionales([...imagenesAdicionales, '']);
  };

  const eliminarImagenAdicional = (index) => {
    const nuevas = imagenesAdicionales.filter((_, i) => i !== index);
    setImagenesAdicionales(nuevas);
  };

  const actualizarImagenAdicional = (index, valor) => {
    const nuevas = [...imagenesAdicionales];
    nuevas[index] = valor;
    setImagenesAdicionales(nuevas);
  };

  // === FUNCIONES PARA TAGS ===
  const agregarTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const eliminarTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  // === CONTADOR DE PALABRAS ===
  const contarPalabras = (texto) => {
    return texto?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
  };

  // === FUNCIÓN PARA FORMATO DEL TEXTO ===
  const aplicarFormato = (tagInicio, tagFin) => {
    const textarea = document.getElementById('cuerpo-noticia');
    if (!textarea) return; // Por seguridad
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoSeleccionado = cuerpo.substring(start, end);
    
    const nuevoTexto = 
      cuerpo.substring(0, start) + 
      tagInicio + textoSeleccionado + tagFin + 
      cuerpo.substring(end);
    
    setCuerpo(nuevoTexto);
    
    // Devolvemos el foco al textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagInicio.length, end + tagInicio.length);
    }, 10);
  };

  // === LIMPIAR FORMULARIO ===
  const limpiarFormulario = () => {
    setTitulo('');
    setBajada('');
    setCuerpo('');
    setAutor('');
    setFuente('');
    setImagenPrincipal('');
    setImagenesAdicionales(['']);
    setTags([]);
    setMetaDescripcion('');
    setPalabrasClave('');
    setVideoUrl('');
    setUrgente(false);
    setDestacado(false);
    setEstado('publicado');
    setNoticiaEditando(null);
    const now = new Date();
    setFechaPublicacion(now.toISOString().split('T')[0]);
    setHoraPublicacion(now.toTimeString().slice(0, 5));
  };

  // === CREAR / ACTUALIZAR NOTICIA ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(noticiaEditando ? 'Actualizando noticia...' : 'Publicando noticia...');

    try {
      const galeria = imagenesAdicionales.filter(img => img.trim() !== '');
      
      // Preparar datos
      const datosNoticia = {
        titulo: titulo.trim(),
        bajada: bajada.trim(),
        categoria,
        cuerpo: cuerpo.trim(),
        autor: autor.trim() || 'Redacción',
        fuente: fuente.trim(),
        imagenPrincipal: imagenPrincipal.trim(),
        imagen: imagenPrincipal.trim(), // Compatibilidad
        galeriaImagenes: galeria,
        urgente,
        destacado,
        estado,
        tags,
        metaDescripcion: metaDescripcion.trim() || bajada.trim().slice(0, 160),
        palabrasClave: palabrasClave.split(',').map(k => k.trim()).filter(k => k),
        videoUrl: videoUrl.trim(),
        slug: titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };

      // Fecha
      if (publicarAhora) {
        datosNoticia.fecha = serverTimestamp();
        datosNoticia.fechaPublicacion = serverTimestamp();
      } else {
        const fechaProg = new Date(`${fechaPublicacion}T${horaPublicacion}`);
        datosNoticia.fecha = fechaProg;
        datosNoticia.fechaPublicacion = fechaProg;
      }

      if (noticiaEditando) {
        // ACTUALIZAR
        await updateDoc(doc(db, 'noticias', noticiaEditando.id), datosNoticia);
        setMensaje('¡Noticia actualizada con éxito!');
        
        // Actualizar lista local
        setNoticias(noticias.map(n => n.id === noticiaEditando.id ? { ...n, ...datosNoticia } : n));
        
        setTimeout(() => {
          setMensaje('');
          setVista('lista');
          limpiarFormulario();
        }, 1500);
        
      } else {
        // CREAR NUEVA
        datosNoticia.fechaCreacion = serverTimestamp();
        datosNoticia.visitas = 0;
        datosNoticia.likes = 0;
        datosNoticia.compartidos = 0;
        
        const docRef = await addDoc(collection(db, 'noticias'), datosNoticia);
        
        setMensaje(`¡Noticia ${estado === 'borrador' ? 'guardada como borrador' : 'publicada'} con éxito!`);
        
        if (estado === 'publicado') {
          limpiarFormulario();
        }
        
        setTimeout(() => {
          setMensaje('');
          setVista('lista');
          cargarNoticias();
        }, 1500);
      }

    } catch (error) {
      console.error("Error:", error);
      setMensaje('Hubo un error: ' + error.message);
    }
  };

  // === VISTA: LISTA DE NOTICIAS ===
  if (vista === 'lista') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 font-serif">
                Gestión de Noticias
              </h1>
              <p className="text-gray-500 mt-1">Administra todas las noticias del diario</p>
            </div>
            <button
              onClick={() => {
                limpiarFormulario();
                setVista('crear');
              }}
              className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-md flex items-center gap-2"
            >
              <span>+</span> Nueva Noticia
            </button>
          </div>

          {/* MENSAJE */}
          {mensaje && (
            <div className={`mb-6 p-4 rounded-lg ${
              mensaje.includes('error') || mensaje.includes('Error')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {mensaje}
            </div>
          )}

          {/* FILTROS */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Título, autor o tag..."
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="todas">Todas las categorías</option>
                  <option value="Sociedad">Sociedad</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Sucesos">Sucesos</option>
                  <option value="Política">Política</option>
                  <option value="Economía">Economía</option>
                  <option value="Turismo">Turismo</option>
                  <option value="Villa Carlos Paz">Villa Carlos Paz</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Salud">Salud</option>
                  <option value="Mundo">Mundo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="todas">Todos los estados</option>
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-500">
                  Mostrando <span className="font-bold">{noticiasFiltradas.length}</span> de {noticias.length} noticias
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h2 className="font-bold text-lg">Bandeja de Mensajes</h2>
                <button onClick={cargarMensajes} className="text-sm bg-slate-800 px-3 py-2 rounded hover:bg-slate-700 transition-colors">
                  🔄 Actualizar
                </button>
              </div>

              {cargandoMensajes ? (
                <div className="p-10 text-center text-gray-500">Cargando mensajes...</div>
              ) : mensajes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <span className="text-4xl block mb-2">📭</span>
                  No tenés ningún mensaje nuevo.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {mensajes.map(m => (
                    <div key={m.id} className={`p-6 transition-colors ${m.leido ? 'bg-white' : 'bg-orange-50/50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          {!m.leido && <span className="w-3 h-3 bg-orange-600 rounded-full shadow-sm"></span>}
                          <h3 className={`text-lg text-slate-900 ${m.leido ? 'font-medium' : 'font-bold'}`}>{m.asunto}</h3>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                          {/* Asume que tenés tu función formatearFecha a mano */}
                          {m.fecha ? formatearFecha(m.fecha) : 'Sin fecha'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pl-6">
                        <span className="font-bold">{m.nombre}</span>
                        <span>•</span>
                        <a href={`mailto:${m.email}`} className="text-blue-600 hover:underline">{m.email}</a>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg text-gray-800 text-sm whitespace-pre-wrap border border-gray-200 ml-6">
                        {m.mensaje}
                      </div>

                      <div className="mt-4 flex gap-2 justify-end">
                        <button 
                          onClick={() => marcarMensajeLeido(m.id, m.leido)}
                          className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${m.leido ? 'text-gray-600 hover:bg-gray-100' : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'}`}
                        >
                          {m.leido ? 'Marcar como no leído' : 'Marcar como leído'}
                        </button>
                        <button 
                          onClick={() => eliminarMensaje(m.id)}
                          className="px-4 py-2 text-sm font-medium bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* TABLA DE NOTICIAS */}
          {cargando ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
            </div>
          ) : noticiasFiltradas.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 text-lg mb-4">No se encontraron noticias</p>
              {noticias.length === 0 ? (
                <div>
                  <p className="text-gray-400 text-sm mb-4">Todavía no hay noticias en la base de datos.</p>
                  <button
                    onClick={() => {
                      limpiarFormulario();
                      setVista('crear');
                    }}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Crear primera noticia
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroCategoria('todas');
                    setFiltroEstado('todas');
                  }}
                  className="text-orange-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            
            
          ) : (
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Noticia</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Autor</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stats</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>

                  
                  <tbody className="divide-y divide-gray-200">
                    {noticiasFiltradas.map((noticia) => (
                      <tr key={noticia.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {(noticia.imagenPrincipal || noticia.imagen) && (
                              <img
                                src={noticia.imagenPrincipal || noticia.imagen}
                                alt=""
                                className="w-12 h-12 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate max-w-xs">
                                {noticia.titulo}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {noticia.urgente && <span className="text-xs text-red-600">🔴</span>}
                                {noticia.destacado && <span className="text-xs text-yellow-600">⭐</span>}
                                {noticia.galeriaImagenes?.length > 0 && (
                                  <span className="text-xs text-gray-400">📷 {noticia.galeriaImagenes.length + 1}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {noticia.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {noticia.autor || 'Redacción'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatearFecha(noticia.fechaPublicacion || noticia.fecha)}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={noticia.estado || 'publicado'}
                            onChange={(e) => cambiarEstado(noticia.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${
                              (noticia.estado || 'publicado') === 'publicado'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : noticia.estado === 'borrador'
                                ? 'bg-gray-100 text-gray-700 border-gray-300'
                                : 'bg-orange-100 text-orange-700 border-orange-300'
                            }`}
                          >
                            <option value="publicado">Publicado</option>
                            <option value="borrador">Borrador</option>
                            <option value="archivado">Archivado</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          <div className="flex gap-3">
                            <span title="Visitas">👁 {noticia.visitas || 0}</span>
                            <span title="Likes">❤️ {noticia.likes || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/noticia/${noticia.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver noticia"
                            >
                              👁
                            </a>
                            <button
                              onClick={() => iniciarEdicion(noticia)}
                              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => eliminarNoticia(noticia.id)}
                              disabled={noticiaEliminando === noticia.id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              {noticiaEliminando === noticia.id ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  

  // === VISTA: CREAR / EDITAR NOTICIA ===
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => {
                setVista('lista');
                limpiarFormulario();
              }}
              className="text-sm text-gray-500 hover:text-orange-600 transition-colors mb-2"
            >
              ← Volver al listado
            </button>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">
              {noticiaEditando ? 'Editar Noticia' : 'Nueva Noticia'}
            </h1>
          </div>
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* MENSAJE */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.includes('error') || mensaje.includes('Error')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {mensaje}
          </div>
        )}

        {/* TABS */}
        <div className="bg-white rounded-t-lg border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'contenido', label: '📝 Contenido' },
              { id: 'imagenes', label: '📷 Imágenes' },
              { id: 'seo', label: '🔍 SEO' },
              { id: 'avanzado', label: '⚙️ Avanzado' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200">
          
          {/* === TAB: CONTENIDO === */}
          {activeTab === 'contenido' && (
            <div className="p-6 space-y-6">
              
              {/* Título */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Título de la Noticia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-serif text-lg"
                  placeholder="Ej: Aumenta el boleto urbano en un 25% desde marzo"
                  required
                  maxLength={150}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {titulo.length}/150 caracteres
                </div>
              </div>

              {/* Bajada */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bajada (Resumen) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={bajada}
                  onChange={(e) => setBajada(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Breve resumen que aparecerá en la portada..."
                  required
                  maxLength={300}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {bajada.length}/300 caracteres
                </div>
              </div>

              {/* Categoría y Autor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Sociedad">Sociedad</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Sucesos">Sucesos</option>
                    <option value="Política">Política</option>
                    <option value="Economía">Economía</option>
                    <option value="Turismo">Turismo</option>
                    <option value="Villa Carlos Paz">Villa Carlos Paz</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Salud">Salud</option>
                    <option value="Mundo">Mundo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Autor / Periodista <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>
              </div>

              {/* Fuente */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fuente de la Noticia
                </label>
                <input
                  type="text"
                  value={fuente}
                  onChange={(e) => setFuente(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Prensa Municipal, Agencia Télam, etc."
                />
              </div>

              {/* Cuerpo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cuerpo de la Noticia <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  
                  {/* BOTONERA DE FORMATO REAL */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex gap-2">
                    <button type="button" onClick={() => aplicarFormato('<b>', '</b>')} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 font-bold">B</button>
                    <button type="button" onClick={() => aplicarFormato('<i>', '</i>')} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 italic">I</button>
                    <button type="button" onClick={() => aplicarFormato('<u>', '</u>')} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 underline">U</button>
                    <span className="border-l mx-2"></span>
                    <button type="button" onClick={() => {
                      const url = prompt("Ingresá la URL del enlace:");
                      if(url) aplicarFormato(`<a href="${url}" target="_blank" class="text-orange-600 underline font-bold">`, '</a>');
                    }} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">🔗</button>
                    <button type="button" onClick={() => aplicarFormato('<blockquote>', '</blockquote>')} className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100">❝</button>
                  </div>
                  
                  {/* EL TEXTAREA CON EL ID NECESARIO */}
                  <textarea
                    id="cuerpo-noticia"
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    className="w-full p-4 focus:outline-none min-h-[300px]"
                    placeholder="Escribí el desarrollo de la noticia. Seleccioná el texto y usá los botones de arriba para darle formato..."
                    required
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{contarPalabras(cuerpo)} palabras</span>
                  <span>Mínimo recomendado: 150 palabras</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Etiquetas (Tags)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && agregarTag(e)}
                    className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Agregar etiqueta y presionar Enter"
                  />
                  <button
                    type="button"
                    onClick={agregarTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => eliminarTag(tag)}
                        className="hover:text-orange-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === TAB: IMÁGENES === */}
          {activeTab === 'imagenes' && (
            <div className="p-6 space-y-6">
              
              {/* Imagen Principal */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imagen Principal (Portada) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={imagenPrincipal}
                  onChange={(e) => setImagenPrincipal(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://ejemplo.com/imagen-principal.jpg"
                  required
                />
                {imagenPrincipal && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Vista previa:</p>
                    <img
                      src={imagenPrincipal}
                      alt="Preview"
                      className="max-h-48 rounded-lg object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              {/* Galería */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imágenes Adicionales (Galería)
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Agrega más imágenes para enriquecer la noticia
                </p>
                
                {imagenesAdicionales.map((img, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => actualizarImagenAdicional(index, e.target.value)}
                      className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={`URL de imagen ${index + 2}`}
                    />
                    {imagenesAdicionales.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarImagenAdicional(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={agregarImagenAdicional}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span>+</span> Agregar otra imagen
                </button>
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Video (URL de YouTube)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}

          {/* === TAB: SEO === */}
          {activeTab === 'seo' && (
            <div className="p-6 space-y-6">
              
              {/* Meta descripción */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Meta Descripción (SEO)
                </label>
                <textarea
                  value={metaDescripcion}
                  onChange={(e) => setMetaDescripcion(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Descripción que aparecerá en Google..."
                  maxLength={160}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{metaDescripcion.length}/160 caracteres</span>
                  <span>Si está vacío, se usa la bajada</span>
                </div>
              </div>

              {/* Palabras clave */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Palabras Clave (SEO)
                </label>
                <input
                  type="text"
                  value={palabrasClave}
                  onChange={(e) => setPalabrasClave(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="noticia, actualidad, villa carlos paz, ..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separadas por comas.
                </p>
              </div>

              {/* Preview de Google */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-bold text-gray-700 mb-3">Vista previa en Google:</p>
                <div className="bg-white p-4 rounded border max-w-2xl">
                  <p className="text-blue-800 text-lg hover:underline cursor-pointer truncate">
                    {titulo || 'Título de la noticia'} | Diario Digital
                  </p>
                  <p className="text-green-700 text-sm">
                    www.tudiario.com/noticias/{titulo ? titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'slug'}
                  </p>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {metaDescripcion || bajada || 'Descripción...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === TAB: AVANZADO === */}
          {activeTab === 'avanzado' && (
            <div className="p-6 space-y-6">
              
              {/* Estado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Estado de la Noticia
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'borrador', label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-300' },
                    { value: 'publicado', label: 'Publicado', color: 'bg-green-100 text-green-700 border-green-300' },
                    { value: 'archivado', label: 'Archivado', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex-1 cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                        estado === opt.value 
                          ? opt.color + ' border-current' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="estado"
                        value={opt.value}
                        checked={estado === opt.value}
                        onChange={(e) => setEstado(e.target.value)}
                        className="hidden"
                      />
                      <span className="font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Programar */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Programar Publicación
                </label>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={publicarAhora}
                      onChange={() => setPublicarAhora(true)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span>Publicar ahora</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!publicarAhora}
                      onChange={() => setPublicarAhora(false)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span>Programar</span>
                  </label>
                </div>
                
                {!publicarAhora && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={fechaPublicacion}
                        onChange={(e) => setFechaPublicacion(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Hora</label>
                      <input
                        type="time"
                        value={horaPublicacion}
                        onChange={(e) => setHoraPublicacion(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">
                  Opciones Especiales
                </label>
                
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <input
                    type="checkbox"
                    id="urgente"
                    checked={urgente}
                    onChange={(e) => setUrgente(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="urgente" className="flex-1 cursor-pointer">
                    <span className="font-bold text-red-800">🔴 ÚLTIMO MOMENTO</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="destacado" className="flex-1 cursor-pointer">
                    <span className="font-bold text-yellow-800">⭐ NOTICIA DESTACADA</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          

          {/* === BOTONES === */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Resumen:</span>{' '}
                {contarPalabras(cuerpo)} palabras | 
                {imagenesAdicionales.filter(i => i).length + (imagenPrincipal ? 1 : 0)} imágenes | 
                {tags.length} tags
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVista('lista');
                    limpiarFormulario();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-orange-600 transition-colors font-bold shadow-md"
                >
                  {noticiaEditando ? '💾 Guardar Cambios' : (estado === 'borrador' ? '💾 Guardar Borrador' : '📰 Publicar Noticia')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}