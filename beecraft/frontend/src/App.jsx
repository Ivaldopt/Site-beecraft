import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import EmConstrucao from './pages/EmConstrucao';

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
      </Routes>
      <Footer />
    </>
  );
}