import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Restaurant = () => {
  const [category, setCategory] = useState('food');
  const [menu, setMenu] = useState({ food: [], deserts: [], wine: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/restaurant/menu').then(res => {
      const organized = res.data.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, { food: [], deserts: [], wine: [] });
      setMenu(organized);
      setLoading(false);
    });
  }, []);

  const images = {
    food: "https://images.unsplash.com/photo-1550966841-3ee32ba213e7?q=80&w=2080&auto=format&fit=crop",
    deserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop",
    wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop"
  };

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center font-serif text-amber-200 animate-pulse uppercase tracking-widest">Designing the Menu</div>;

  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="grain" />
      
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={category}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5 }}
            src={images[category]}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Dining"
          />
        </AnimatePresence>
        <div className="relative z-10 text-center">
          <span className="text-amber-200 tracking-[0.6em] uppercase text-[10px] block mb-4">Culinary Excellence</span>
          <h1 className="text-6xl md:text-9xl font-serif text-stone-50 italic font-light">The Menu</h1>
        </div>
      </div>

      <div className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-center gap-16 mb-24 border-b border-stone-800 pb-8">
          {['food', 'deserts', 'wine'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`uppercase tracking-[0.4em] text-[10px] font-bold transition-all ${category === cat ? 'text-amber-200' : 'text-stone-600 hover:text-stone-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div 
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-16"
        >
          {menu[category].map((item, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="flex justify-between items-baseline mb-4">
                <h4 className="text-2xl font-serif text-stone-100 group-hover:text-amber-200 transition-colors duration-500">{item.name}</h4>
                <div className="flex-grow mx-4 border-b border-stone-800 border-dotted" />
                <span className="font-serif text-xl text-stone-400 italic">${item.price}</span>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed max-w-sm">{item.desc || item.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Restaurant;
