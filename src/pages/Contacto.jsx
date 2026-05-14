import { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState({ tipo: '', texto: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeEstado({ tipo: '', texto: '' });

    try {
      // Guardamos en Firebase en la colección 'mensajes'
      await addDoc(collection(db, 'mensajes'), {
        ...formData,
        fecha: serverTimestamp(),
        leido: false // Para saber en el admin si ya lo leíste
      });

      setMensajeEstado({
        tipo: 'exito',
        texto: '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.'
      });
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' }); // Limpiamos form

    } catch (error) {
      console.error("Error enviando mensaje: ", error);
      setMensajeEstado({
        tipo: 'error',
        texto: 'Hubo un problema al enviar el mensaje. Intentá de nuevo más tarde.'
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <Helmet>
        <title>Contacto | Diario Impacto</title>
        <meta name="description" content="Comunicate con la redacción de Diario Impacto. Envianos tus sugerencias, noticias o consultas publicitarias." />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4">
        
        <Link to="/" className="text-sm font-medium text-orange-600 hover:text-orange-800 transition-colors mb-6 inline-block">
          ← Volver al inicio
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white text-center">
            <h1 className="text-3xl md:text-4xl font-black font-serif italic tracking-tighter mb-2">
              CONTACTO<span className="text-orange-500">.</span>
            </h1>
            <p className="text-gray-400">Dejanos tu sugerencia, reclamo o consulta publicitaria.</p>
          </div>

          <div className="p-8">
            {mensajeEstado.texto && (
              <div className={`p-4 rounded-lg mb-6 text-center font-bold ${
                mensajeEstado.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {mensajeEstado.texto}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre completo *</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Correo electrónico *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Asunto *</label>
                <select 
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                >
                  <option value="">Seleccioná un motivo...</option>
                  <option value="Sugerencia">Sugerencia para nota</option>
                  <option value="Reclamo">Reclamo / Queja vecinal</option>
                  <option value="Publicidad">Consulta por Publicidad</option>
                  <option value="Otro">Otro motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mensaje *</label>
                <textarea 
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="Escribí tu mensaje acá..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={enviando}
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400"
              >
                {enviando ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}