import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRestaurantMenu } from '../services/api';
import useLanguage from '../hooks/useLanguage';

const Restaurant = () => {
  const [category, setCategory] = useState('food');
  const [menu, setMenu] = useState({ food: [], deserts: [], wine: [] });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    getRestaurantMenu().then(data => {
      const organized = data.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, { food: [], deserts: [], wine: [] });
      setMenu(organized);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const images = {
    food: "https://images.unsplash.com/photo-1550966841-3ee32ba213e7?q=80&w=2080&auto=format&fit=crop",
    deserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop",
    wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop"
  };

  if (loading) return (
    <div className="h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-sm tracking-[0.8em] uppercase text-stone-600 animate-pulse font-bold">
          {t('Gastronomy', 'សិល្បៈម្ហូបអាហារ')}
        </div>
        <div className="h-px w-12 bg-stone-800 mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="bg-[#080808] min-h-screen pb-40">
      <div className="grain" />
      
      <div className="relative h-[85vh] flex items-center px-8 lg:px-24 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={category}
            initial={{ opacity: 0, scale: 1.1, filter: "grayscale(1)" }}
            animate={{ opacity: 0.4, scale: 1, filter: "grayscale(0.4)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
            src={images[category]}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Dining"
          />
        </AnimatePresence>
        
        <div className="relative z-10 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            className="text-[10px] tracking-[0.8em] text-stone-200 uppercase block mb-12 font-bold"
          >
            Culinary Arts
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1.2 }}
            className="text-7xl md:text-[10rem] leading-[0.9] font-serif mb-12 tracking-tighter"
          >
            The <br/> <span className="italic font-light text-stone-400 text-reveal">Palate.</span>
          </motion.h1>

        </div>
      </div>

      <div className="py-40 px-8 lg:px-24 max-w-[1600px] mx-auto">
        {/* Category Toggle */}
        <div className="flex flex-wrap justify-start gap-x-20 gap-y-8 mb-40 border-b border-stone-900 pb-12">
          {['food', 'deserts', 'wine'].map((cat, i) => (
            <motion.button 
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setCategory(cat)}
              className="group relative py-4"
            >
              <span className={`text-[11px] uppercase tracking-[0.6em] transition-all duration-700 ${category === cat ? 'text-stone-100 font-bold' : 'text-stone-600 group-hover:text-stone-300'}`}>
                {cat === 'deserts' ? 'CONFECTIONS' : cat === 'wine' ? 'THE CELLAR' : 'GASTRONOMY'}
              </span>
              <motion.div 
                className={`absolute bottom-0 left-0 h-px bg-stone-100 transition-all duration-700 ${category === cat ? 'w-full' : 'w-0 group-hover:w-12'}`}
              />
            </motion.button>
          ))}
        </div>

        <motion.div 
          key={category}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-24"
        >
          {/* Menu Items */}
          <div className="lg:col-span-8 space-y-24">
            {menu[category].map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-stone-900 pb-16"
              >
                <div className="md:col-span-8 space-y-4">
                  <h4 className="text-3xl md:text-5xl font-serif text-stone-100 group-hover:italic transition-all duration-700">{item.name}</h4>
                  <p className="text-stone-500 text-lg leading-relaxed font-light italic max-w-xl">{item.desc || item.description}</p>
                </div>
                <div className="md:col-span-4 flex md:justify-end items-start pt-2">
                  <span className="text-2xl font-serif text-stone-300 tracking-tighter">${item.price.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
            
            {menu[category].length === 0 && (
              <p className="text-stone-600 font-serif italic text-2xl">The cellar is being restocked. Please inquire with the concierge.</p>
            )}
          </div>

          {/* Sidebar Note */}
          <div className="lg:col-span-4 flex flex-col justify-start">
             <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="glass-card p-12 sticky top-40"
             >
                <span className="text-[9px] tracking-[0.4em] text-stone-500 block mb-8 font-bold uppercase">Note on Sourcing</span>
                <p className="text-sm text-stone-400 font-light leading-relaxed italic mb-10">
                  Our ingredients are harvested daily from our private estates and master-artisans. 
                  We maintain a zero-mile philosophy where possible, ensuring the absolute integrity of every dish.
                </p>
                <div className="w-12 h-px bg-stone-700" />
             </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Restaurant;
