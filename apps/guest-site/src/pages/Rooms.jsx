import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAvailableRooms } from '../services/api';
import { Link } from 'react-router-dom';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailableRooms().then(data => {
      setRooms(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex items-center justify-center font-serif text-amber-200/50 text-xl tracking-widest animate-pulse">
      Curating the Collection
    </div>
  );

  return (
    <div className="bg-zinc-950 min-h-screen pt-40 pb-20 px-6">
      <div className="grain" />
      
      <div className="max-w-7xl mx-auto mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <span className="text-amber-200/60 tracking-[0.4em] uppercase text-[10px] block mb-4">Residential Collection</span>
          <h1 className="text-5xl md:text-8xl mb-8 leading-tight">Masterfully <br/><span className="italic font-light">Crafted</span> Spaces</h1>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
        {rooms.map((room, i) => (
          <motion.div 
            key={room.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            className="group"
          >
            <div className="relative overflow-hidden aspect-[3/4] mb-8">
              <img 
                src={`https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop`} 
                alt={room.type_name}
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-700" />
              <div className="absolute inset-0 p-10 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-700">
                <Link 
                  to="/booking" 
                  state={{ roomId: room.id, roomType: room.type_name, price: room.base_price }}
                  className="luxury-button border-white/40 text-white hover:border-white text-center"
                >
                  Reserve Now
                </Link>
              </div>
            </div>
            
            <div className="flex justify-between items-start border-b border-stone-800 pb-6">
              <div>
                <h3 className="text-2xl font-serif mb-2">{room.type_name}</h3>
                <p className="text-stone-500 text-[10px] uppercase tracking-widest">Available Residence</p>
              </div>
              <div className="text-right">
                <span className="text-amber-200 text-xl font-serif block">${room.base_price}</span>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest">per night</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Rooms;