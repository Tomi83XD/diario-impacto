import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import DetalleNoticia from './pages/DetalleNoticia';
import Login from './pages/Login';
import PanelAdmin from './pages/PanelAdmin';
import Contacto from './pages/Contacto';

// Importamos el "patovica" que armaste
import RutaProtegida from './components/RutaProtegida'; 

function App() {
  return (
    <BrowserRouter>
      {/* Contenedor principal para que el Footer siempre quede abajo */}
      <div className="flex flex-col min-h-screen">
        
        {/* El encabezado de la página */}
        <Navbar />

        {/* El flex-grow hace que el main ocupe todo el espacio disponible y empuje el footer al fondo */}
        <main className="flex-grow bg-slate-50">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/noticia/:id" element={<DetalleNoticia />} />
            <Route path="/contacto" element={<Contacto />} />
            
            {/* Rutas de Autenticación */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas Privadas / Administrativas */}
            {/* Envolvemos PanelAdmin con RutaProtegida */}
            <Route 
              path="/admin" 
              element={
                <RutaProtegida>
                  <PanelAdmin />
                </RutaProtegida>
              } 
            />
          </Routes>
        </main>

        {/* El pie de página */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;