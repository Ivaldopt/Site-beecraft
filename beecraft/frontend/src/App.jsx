import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import EmConstrucao from './pages/EmConstrucao';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import WhatsappFab from './components/WhatsappFab';
import Shop from './pages/Shop';
import NotFound from './pages/NotFound';
import ContentPage from './pages/ContentPage';

const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

export default function App() {
  if (MAINTENANCE) {
    return <EmConstrucao />;
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loja" element={<Shop />} />
        <Route path="/agendas-planners" element={<Shop categoryOverride="agendas" title="Agendas e planners" />} />
        <Route path="/agendas-planners/:tipo" element={<Shop categoryOverride="agendas" title="Agendas e planners" />} />
        <Route path="/cadernos" element={<Shop categoryOverride="cadernos" title="Cadernos" />} />
        <Route path="/cadernos/:tipo" element={<Shop categoryOverride="cadernos" title="Cadernos" />} />
        <Route path="/imanes-acessorios" element={<Shop categoryOverride="blocos" title="Ímanes e acessórios" />} />
        <Route path="/brindes" element={<Shop title="Brindes personalizados" />} />
        <Route path="/presentes" element={<Shop title="Brindes personalizados" />} />
        <Route path="/produto/:slug" element={<ProductDetail />} />
        <Route path="/personalizar/:slug" element={<ProductDetail />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Cart />} />
        <Route path="/:page" element={<ContentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <WhatsappFab />
    </>
  );
}
