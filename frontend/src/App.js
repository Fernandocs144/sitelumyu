import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import './App.css';
import { LanguageProvider } from './i18n';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Solutions from './pages/Solutions';
import CaseStudies from './pages/CaseStudies';
import Studio from './pages/Studio';
import Contact from './pages/Contact';


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}


function ConditionalFooter() {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return null;
  }

  return <Footer />;
}


function AppContent() {
  const { pathname } = useLocation();

  const isHome = pathname === '/';

  return (
    <div
      className={`
        min-h-screen
        font-body
        text-white
        ${isHome ? 'bg-ink' : ''}
      `}
      style={
        isHome
          ? undefined
          : {
              background:
                `
                  radial-gradient(
                    circle at 18% 45%,
                    rgba(219, 0, 126, 0.18),
                    transparent 38%
                  ),
                  radial-gradient(
                    circle at 82% 48%,
                    rgba(58, 67, 220, 0.22),
                    transparent 42%
                  ),
                  linear-gradient(
                    90deg,
                    #12051d 0%,
                    #130923 45%,
                    #11163d 100%
                  )
                `,
            }
      }
    >
      <ScrollToTop />

      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      <ConditionalFooter />
    </div>
  );
}


function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;