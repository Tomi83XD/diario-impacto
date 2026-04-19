import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import DetalleNoticia from './pages/DetalleNoticia';
import Login from './pages/Login';
import PanelAdmin from './pages/PanelAdmin';

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
            
            {/* Rutas Privadas / Administrativas */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<PanelAdmin />} />
          </Routes>
        </main>

        {/* El pie de página */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;