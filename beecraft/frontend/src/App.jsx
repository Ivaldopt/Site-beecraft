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
        <Route path="/produto/:slug" element={<ProductDetail />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <WhatsappFab />
    </>
  );
}
