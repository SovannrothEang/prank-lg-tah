import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useLanguage from '../hooks/useLanguage';

const Navbar = () => {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-1000 px-8 py-10 ${
        isScrolled ? 'py-6 bg-zinc-950/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1800px] mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="group relative overflow-hidden">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          >
            <span className="text-2xl font-serif tracking-[0.3em] uppercase text-stone-50 group-hover:text-stone-300 transition-colors duration-700">
              Elysian
            </span>
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-12">
          {[
            { name: t('The Residences', 'លំនៅដ្ឋាន'), path: '/rooms' },
            { name: t('Gastronomy', 'ម្ហូបអាហារ'), path: '/restaurant' },
            { name: t('Our Story', 'ប្រវត្តិរបស់យើង'), path: '/about' },
            { name: t('Contact', 'ទំនាក់ទំនង'), path: '/contact' },
          ].map((item, i) => (
            <Link 
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center group py-2"
            >
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.8 }}
                className={`text-[12px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${lang === 'kh' ? 'khmer-font' : ''} ${pathname === item.path ? 'text-stone-50' : 'text-stone-400 group-hover:text-stone-50'}`}
              >
                {item.name}
              </motion.span>
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-200/40 transition-all duration-500 scale-0 group-hover:scale-100 ${pathname === item.path ? 'scale-100' : ''}`} />
            </Link>
          ))}
          
          <div className="h-4 w-px bg-stone-800 mx-2" />

          {/* Language Switcher */}
          <button 
            onClick={() => setLang(lang === 'en' ? 'kh' : 'en')}
            className="text-[12px] uppercase tracking-[0.1em] text-stone-500 hover:text-stone-50 transition-colors flex items-center gap-2 font-bold"
          >
            <span className={lang === 'en' ? 'text-stone-50' : ''}>EN</span>
            <span className="opacity-20 font-normal">|</span>
            <span className={lang === 'kh' ? 'text-stone-50 khmer-font' : ''}>ខ្មែរ</span>
          </button>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <Link to="/profile" className="luxury-button !py-3 !px-12 border-stone-800 flex items-center gap-3 font-bold">
              <span>{t('Private Access', 'ចូលប្រើប្រាស់')}</span>
            </Link>
          </motion.div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-stone-50 flex flex-col gap-1.5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div className={`w-6 h-px bg-current transition-all duration-500 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-6 h-px bg-current transition-all duration-500 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-px bg-current transition-all duration-500 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-zinc-950 z-[99] flex flex-col items-center justify-center gap-10 lg:hidden"
          >
             {[
              { name: 'Residences', path: '/rooms' },
              { name: 'Gastronomy', path: '/restaurant' },
              { name: 'Heritage', path: '/about' },
              { name: 'Concierge', path: '/contact' },
            ].map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-4xl font-serif text-stone-50 hover:italic transition-all"
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
