import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <span className="text-3xl font-serif tracking-[0.4em] uppercase text-stone-50 group-hover:text-stone-300 transition-colors duration-700">
              Elysian
            </span>
          </motion.div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-stone-50 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-16">
          {[
            { name: 'The Residences', path: '/rooms' },
            { name: 'Gastronomy', path: '/restaurant' },
            { name: 'Our Story', path: '/about' },
            { name: 'Contact', path: '/contact' },
          ].map((item, i) => (
            <Link 
              key={item.path}
              to={item.path}
              className="relative text-[9px] uppercase tracking-[0.5em] text-stone-400 hover:text-stone-50 transition-all duration-500 py-2 group"
            >
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.8 }}
              >
                {item.name}
              </motion.span>
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-stone-50 transition-all duration-500 scale-0 group-hover:scale-100 ${pathname === item.path ? 'scale-100' : ''}`} />
            </Link>
          ))}
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <Link to="/profile" className="luxury-button !py-3 !px-8 border-stone-800">
              Access Private
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
