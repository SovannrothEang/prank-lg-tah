import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { pathname } = useLocation();
  
  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="group flex flex-col items-center">
          <span className="text-2xl font-serif tracking-[0.5em] uppercase text-stone-50 group-hover:text-amber-200 transition-colors duration-500">
            Elysian
          </span>
          <span className="text-[8px] tracking-[0.8em] uppercase text-amber-200/50 -mt-1">Hotels & Resorts</span>
        </Link>

        <div className="hidden lg:flex items-center gap-12">
          {[
            { name: 'The Residence', path: '/rooms' },
            { name: 'Gastronomy', path: '/restaurant' },
            { name: 'Our Story', path: '/about' },
            { name: 'Contact', path: '/contact' },
          ].map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className="relative text-[10px] uppercase tracking-[0.3em] text-stone-400 hover:text-stone-50 transition-colors py-2 group"
            >
              {item.name}
              {pathname === item.path && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 w-full h-px bg-amber-200"
                />
              )}
            </Link>
          ))}
          
          <Link to="/profile" className="luxury-button !py-2 !px-6 border-amber-200/40">
            Member
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;