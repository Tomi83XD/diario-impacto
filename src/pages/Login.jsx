import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const navigate = useNavigate();

  // Cargar email guardado al iniciar
  useEffect(() => {
    const emailGuardado = localStorage.getItem('diario_email_recordado');
    if (emailGuardado) {
      setEmail(emailGuardado);
      setRecordarme(true);
    }
  }, []);

  // Contador para desbloqueo
  useEffect(() => {
    if (bloqueado && tiempoRestante > 0) {
      const timer = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            setBloqueado(false);
            setIntentos(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [bloqueado, tiempoRestante]);

  // Validar formato de email
  const esEmailValido = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validaciones previas
    if (bloqueado) {
      setError(`Cuenta bloqueada. Esperá ${tiempoRestante} segundos.`);
      return;
    }

    if (!email.trim()) {
      setError('Ingresá tu correo electrónico.');
      return;
    }

    if (!esEmailValido(email)) {
      setError('El formato del correo no es válido.');
      return;
    }

    if (!password) {
      setError('Ingresá tu contraseña.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Guardar o eliminar email según "recordarme"
      if (recordarme) {
        localStorage.setItem('diario_email_recordado', email);
      } else {
        localStorage.removeItem('diario_email_recordado');
      }
      
      // Resetear intentos
      setIntentos(0);
      
      // Redirigir al panel
      navigate('/admin');
      
    } catch (err) {
      console.error('Error de login:', err);
      
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      
      // Mensajes de error específicos
      let mensajeError = 'Correo o contraseña incorrectos.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          mensajeError = 'No existe una cuenta con este correo.';
          break;
        case 'auth/wrong-password':
          mensajeError = 'Contraseña incorrecta.';
          break;
        case 'auth/invalid-email':
          mensajeError = 'El formato del correo no es válido.';
          break;
        case 'auth/user-disabled':
          mensajeError = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/too-many-requests':
          mensajeError = 'Demasiados intentos. Intentá más tarde.';
          break;
        case 'auth/invalid-credential':
          mensajeError = 'Credenciales inválidas. Verificá tus datos.';
          break;
        default:
          mensajeError = 'Error al iniciar sesión. Intentá de nuevo.';
      }
      
      // Bloquear después de 5 intentos fallidos
      if (nuevosIntentos >= 5) {
        setBloqueado(true);
        setTiempoRestante(60);
        setError('Demasiados intentos fallidos. Cuenta bloqueada por 1 minuto.');
      } else if (nuevosIntentos >= 3) {
        setError(`${mensajeError} (${5 - nuevosIntentos} intentos restantes)`);
      } else {
        setError(mensajeError);
      }
      
    } finally {
      setCargando(false);
    }
  };

  // Recuperar contraseña (placeholder)
  const handleRecuperarPassword = () => {
    if (!email.trim()) {
      setError('Ingresá tu correo para recuperar la contraseña.');
      return;
    }
    // Aquí iría la lógica de Firebase para recuperar contraseña
    alert(`Se enviaría un correo de recuperación a: ${email}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-sans p-4">
      
      {/* Card principal */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        
        {/* Header con color */}
        <div className="bg-slate-900 p-6 text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">
            Diario Digital
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Panel de Administración
          </p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Iniciar Sesión
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  📧
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={cargando || bloqueado}
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  disabled={cargando || bloqueado}
                  className="w-full border border-gray-300 pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  disabled={cargando}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? (
                    <span>🙈</span> // Ocultar
                  ) : (
                    <span>👁️</span> // Mostrar
                  )}
                </button>
              </div>
              
              {/* Indicador de fortaleza */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    <div className={`flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 rounded ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {password.length < 6 ? 'Muy débil' : password.length < 8 ? 'Débil' : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Fuerte' : 'Media'}
                  </p>
                </div>
              )}
            </div>

            {/* Recordarme y Recuperar */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  disabled={cargando}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              
              <button
                type="button"
                onClick={handleRecuperarPassword}
                disabled={cargando}
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Bloqueo */}
            {bloqueado && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-orange-700 text-sm font-medium">
                  ⏱️ Cuenta bloqueada
                </p>
                <p className="text-orange-600 text-xs mt-1">
                  Esperá {tiempoRestante} segundos para intentar de nuevo
                </p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando || bloqueado}
              className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span>
                  <span>Ingresando...</span>
                </>
              ) : bloqueado ? (
                <>
                  <span>⏱️</span>
                  <span>Bloqueado ({tiempoRestante}s)</span>
                </>
              ) : (
                <>
                  <span>🔑</span>
                  <span>Entrar al Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Info adicional */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Acceso exclusivo para periodistas autorizados
            </p>
            <p className="text-xs text-gray-400 mt-1">
              © {new Date().getFullYear()} Diario Digital
            </p>
          </div>
        </div>
      </div>

      {/* Decoración de fondo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>
    </div>
  );
}