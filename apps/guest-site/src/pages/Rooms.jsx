import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { getAvailableRooms } from '../services/api';
import { Link } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useLanguage();
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    getAvailableRooms().then(data => {
      setRooms(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-sm tracking-[0.8em] uppercase text-stone-600 animate-pulse font-bold">
          {t('Residences', 'លំនៅដ្ឋាន')}
        </div>
        <div className="h-px w-12 bg-stone-800 mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="bg-[#080808] min-h-screen pb-40">
      <div className="grain" />
      
      {/* Header Space */}
      <section className="relative pt-60 pb-32 px-8 lg:px-24">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <motion.div 
            style={{ y: titleY }}
            className="lg:col-span-8"
          >
            <span className="text-stone-500 tracking-[0.3em] uppercase text-xs block mb-8 font-bold">{t('Residential Portfolio', 'បណ្តុំលំនៅដ្ឋាន')}</span>
            <h1 className="text-7xl md:text-[10rem] leading-[0.85] font-serif tracking-tighter">
              {t('Private', 'ឯកជនភាព')} <br/> <span className="italic font-light text-stone-400">{t('Sanctuaries.', 'នៃដែនជម្រក។')}</span>
            </h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="lg:col-span-4 border-l border-stone-800 ps-10 pb-4"
          >
             <p className="text-stone-500 text-sm leading-relaxed max-w-xs italic">
              {t('A curated collection of residences designed for the modern aesthete. Meticulous craftsmanship meets unprecedented comfort.', 'ការប្រមូលផ្តុំនៃលំនៅដ្ឋានដែលត្រូវបានរៀបចំឡើងសម្រាប់សោភ័ណភាពទំនើប។ ស្នាដៃដ៏ល្អិតល្អន់ជួបនឹងភាពងាយស្រួលដែលមិនធ្លាប់មាន។')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid Layout */}
      <section className="px-8 lg:px-24">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-32">
          {rooms.map((room, i) => (
            <motion.div 
              key={room.uuid}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
              className={`group flex flex-col ${i % 2 !== 0 ? 'md:mt-32' : ''}`}
            >
              <div className="relative overflow-hidden aspect-[4/5] mb-12 bg-zinc-900">
                <img 
                  src={room.image_path ? `http://localhost:3000${room.image_path}` : `https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop`} 
                  alt={room.type_name}
                  className="w-full h-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-[#080808]/10 group-hover:bg-transparent transition-all duration-1000" />
                
                {/* Hover UI */}
                <div className="absolute inset-0 p-12 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-1000">
                  <div className="flex justify-end">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white bg-white/10 backdrop-blur-md px-4 py-2 font-bold">{t('Available Now', 'នៅទំនេរឥឡូវនេះ')}</span>
                  </div>
                  <Link 
                    to="/booking" 
                    state={{ roomUuid: room.uuid, roomType: room.type_name, price: room.base_price }}
                    className="luxury-button !bg-white !text-black !border-white text-center translate-y-10 group-hover:translate-y-0 transition-transform duration-700"
                  >
                    {t('Initiate Reservation', 'ចាប់ផ្តើមការកក់')}
                  </Link>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3 className="text-4xl md:text-5xl font-serif">{room.type_name}</h3>
                  <div className="text-right">
                    <span className="text-stone-500 text-[10px] uppercase tracking-[0.2em] block mb-1 font-bold">{t('Nightly Rate', 'តម្លៃក្នុងមួយយប់')}</span>
                    <span className="text-2xl font-serif text-stone-200">${room.base_price.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="h-px bg-stone-800 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                
                <div className={`flex justify-between text-stone-500 text-[11px] uppercase tracking-[0.1em] pt-2 font-bold ${lang === 'kh' ? 'khmer-font' : ''}`}>
                  <span>{t('Panoramic View', 'ទិដ្ឋភាពទូទៅ')}</span>
                  <span>{t('Personal Butler', 'អ្នកបម្រើផ្ទាល់ខ្លួន')}</span>
                  <span>{t('Vault Access', 'ការចូលប្រើតុដេក')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-60 px-8 text-center border-t border-stone-900 mt-40">
        <p className="text-stone-600 text-[10px] uppercase tracking-[1em]">End of Collection</p>
      </section>
    </div>
  );
};

export default Rooms;
