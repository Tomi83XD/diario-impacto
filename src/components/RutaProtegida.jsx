import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function RutaProtegida({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Nos conectamos a la autenticación de Firebase
    const auth = getAuth();
    
    // Este "escuchador" se fija si el usuario inició sesión o cerró sesión
    const desuscribir = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });

    // Limpiamos el escuchador cuando el componente se desmonta
    return () => desuscribir();
  }, []);

  // Mientras Firebase piensa, mostramos un loader para que no titile la pantalla
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      </div>
    );
  }

  // Si no hay usuario logueado, lo mandamos de prepo al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si está todo OK, lo dejamos ver el Panel Admin (los "children")
  return children;
}