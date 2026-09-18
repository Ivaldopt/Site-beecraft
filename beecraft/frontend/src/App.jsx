import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Works from './pages/Works';
import WorkCategory from './pages/WorkCategory';
import { trackCatalogEvent } from './utils/analytics';

const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let observer;
    const frame = window.requestAnimationFrame(() => {
      const elements = document.querySelectorAll('main > section, .service-group, .service-offer-grid article, .service-process article, .service-personalization-grid > *, .home-service-grid > *, .products > *');
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -45px' });
      elements.forEach((element, index) => {
        element.classList.add('scroll-reveal');
        element.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
        observer.observe(element);
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const frame = window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, search, hash]);

  return null;
}

function PageAnalytics() {
  const { pathname } = useLocation();
  useEffect(() => { trackCatalogEvent('PAGE_VIEW', null, pathname); }, [pathname]);
  return null;
}

export default function App() {
  if (MAINTENANCE) {
    return <EmConstrucao />;
  }

  return (
    <>
      <Header />
      <ScrollToTop />
      <ScrollReveal />
      <PageAnalytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loja" element={<Shop />} />
        <Route path="/servicos" element={<Services />} />
        <Route path="/servicos/:serviceSlug" element={<ServiceDetail />} />
        <Route path="/nossos-trabalhos" element={<Works />} />
        <Route path="/trabalhos/:categorySlug" element={<WorkCategory />} />
        <Route path="/agendas-planners" element={<Shop categoryOverride="agendas" title="Agendas e planners" />} />
        <Route path="/agendas-planners/:tipo" element={<Shop categoryOverride="agendas" title="Agendas e planners" />} />
        <Route path="/cadernos" element={<Shop categoryOverride="cadernos" title="Cadernos" />} />
        <Route path="/cadernos/:tipo" element={<Shop categoryOverride="cadernos" title="Cadernos" />} />
        <Route path="/imanes-acessorios" element={<Shop categoryOverride="blocos" title="Ímanes e acessórios" hero="magnets" />} />
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
