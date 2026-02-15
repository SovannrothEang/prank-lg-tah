import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import useLanguage from '../hooks/useLanguage';

const Home = () => {
  const { scrollY } = useScroll();
  const { t } = useLanguage();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <div className="bg-[#080808] overflow-hidden">
      <div className="grain" />
      
      {/* Immersive Hero */}
      <section className="relative h-[110vh] flex items-center justify-center">
        <motion.div 
          style={{ y: y1 }}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 3, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale-[0.4]"
            alt="Elysian Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/20 to-[#080808]" />
        </motion.div>
        
        <motion.div 
          style={{ opacity }}
          className="relative z-10 text-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 1.5 }}
            className="flex items-center justify-center gap-6 mb-8"
          >
            <div className="h-px w-16 bg-amber-200/30" />
            <span className="khmer-font text-xs tracking-widest text-amber-200/80 uppercase font-bold">
              {t('Welcome to Elysian', 'ស្វាគមន៍មកកាន់ អេលីសៀន')}
            </span>
            <div className="h-px w-16 bg-amber-200/30" />
          </motion.div>

          <motion.span 
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 0.6, letterSpacing: "0.3em" }}
            transition={{ duration: 2, delay: 0.5 }}
            className="text-xs uppercase text-stone-200 block mb-12 font-bold"
          >
            {t('The Zenith of Quiet Luxury', 'ចំណុចកំពូលនៃភាពស្ងប់ស្ងាត់')}
          </motion.span>
          
          <div className="relative inline-block">
            <motion.h1 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1], delay: 0.2 }}
              className="text-8xl md:text-[10rem] font-serif leading-none"
            >
              ELYSIAN
            </motion.h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="h-px bg-stone-100 absolute -bottom-4 left-0"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            className="mt-20 flex flex-col items-center gap-10"
          >
            <Link to="/rooms" className="luxury-button group">
              <span className="relative z-10">{t('Curate Your Stay', 'រៀបចំការស្នាក់នៅរបស់អ្នក')}</span>
            </Link>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-20 bg-stone-700" 
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Editorial Section */}
      <section className="py-60 px-8 lg:px-24">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-5 space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            >
              <h2 className="text-5xl md:text-7xl leading-[1.1] mb-12">
                {t('A sanctuary designed for the', 'ដែនជម្រកដែលរចនាឡើងសម្រាប់')} <br/> 
                <span className="italic font-light text-stone-400 text-reveal">
                  {t('significant.', 'ភាពសំខាន់។')}
                </span>
              </h2>
              <div className="w-20 h-px bg-stone-500 mb-12" />
              <p className="text-stone-500 text-xl leading-relaxed font-light max-w-md italic">
                {t(
                  'We believe in the eloquence of silence. Every texture, shadow, and scent at Elysian is meticulously calibrated to restore your equilibrium.',
                  'យើងជឿជាក់លើភាពល្អប្រណីតនៃភាពស្ងប់ស្ងាត់។ រាល់វាយនភាព ស្រមោល និងក្លិនក្រអូបត្រូវបានគណនាយ៉ាងល្អិតល្អន់ដើម្បីផ្តល់តុល្យភាពដល់អ្នក។'
                )}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <Link to="/about" className="group flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-stone-200 font-bold">
                {t('Explore the Philosophy', 'ស្វែងយល់ពីទស្សនវិជ្ជា')}
                <span className="w-12 h-px bg-stone-700 group-hover:w-20 transition-all duration-700" />
              </Link>
            </motion.div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-12 gap-6 items-end">
            <motion.div 
              style={{ y: y2 }}
              className="col-span-7 aspect-[4/5] overflow-hidden shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?q=80&w=1935&auto=format&fit=crop" 
                className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-110 grayscale-[0.2]"
                alt="Architecture"
              />
            </motion.div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="col-span-5 aspect-square overflow-hidden mb-20 shadow-2xl bg-zinc-900"
            >
              <img 
                src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale-[0.1]"
                alt="Detail"
              />
            </motion.div>
          </div>
        </div>
      </section>


      {/* Editorial Section */}
      <section className="py-60 px-8 lg:px-24">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-5 space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            >
              <h2 className="text-5xl md:text-7xl leading-[1.1] mb-12">
                A sanctuary <br/> designed <br/> for the <span className="italic font-light text-stone-400">significant.</span>
              </h2>
              <div className="w-20 h-px bg-stone-500 mb-12" />
              <p className="text-stone-500 text-xl leading-relaxed font-light max-w-md">
                We believe in the eloquence of silence. Every texture, shadow, and scent at Elysian is meticulously calibrated to restore your equilibrium.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <Link to="/about" className="group flex items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-stone-200">
                Explore the Philosophy
                <span className="w-12 h-px bg-stone-700 group-hover:w-20 transition-all duration-700" />
              </Link>
            </motion.div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-12 gap-6 items-end">
            <motion.div 
              style={{ y: y2 }}
              className="col-span-7 aspect-[4/5] overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?q=80&w=1935&auto=format&fit=crop" 
                className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-110"
                alt="Architecture"
              />
            </motion.div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="col-span-5 aspect-square overflow-hidden mb-20 shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover"
                alt="Detail"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Grid Gallery */}
      <section className="bg-stone-50 py-60 px-8">
          <div className="max-w-[1400px] mx-auto mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="max-w-xl">
              <span className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6 block font-bold">{t('The Curated Experience', 'បទពិសោធន៍ដែលបានរៀបចំ')}</span>
              <h2 className="text-6xl md:text-8xl text-zinc-950 leading-none">Epicurean <br/> & Wellness</h2>
            </div>
            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed mb-4">
              {t('From Michelin-standard gastronomy to subterranean spa sanctuaries, our offerings are world-class.', 'ពីម្ហូបលំដាប់ផ្កាយ Michelin រហូតដល់ស្ប៉ាដ៏ស្ងប់ស្ងាត់ យើងផ្តល់ជូននូវសេវាកម្មកម្រិតពិភពលោក។')}
            </p>
          </div>
        </div>

        
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "VINTAGE CELLAR", tag: "Gastronomy", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" },
            { title: "STONE SPA", tag: "Sanctuary", img: "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=2070&auto=format&fit=crop" },
            { title: "THE HORIZON", tag: "Venture", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" }
          ].map((exp, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative group aspect-[3/4] overflow-hidden"
            >
              <img src={exp.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt={exp.title} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all duration-700" />
              <div className="absolute inset-0 p-16 flex flex-col justify-between items-center text-white text-center opacity-0 group-hover:opacity-100 transition-all duration-1000">
                <span className="text-[9px] tracking-[0.8em] uppercase border-b border-white/40 pb-2">{exp.tag}</span>
                <div className="space-y-4">
                  <h3 className="text-4xl font-serif">{exp.title}</h3>
                  <span className="text-[8px] tracking-[0.4em] uppercase opacity-60">Discover the space &rarr;</span>
                </div>
                <div />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Invitation */}
      <section className="py-60 px-8 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <h2 className="text-[40vw] font-serif select-none">E</h2>
        </div>
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="relative z-10"
        >
          <span className="text-xs tracking-[0.4em] uppercase text-stone-500 mb-10 block font-bold">{t('Reservations', 'ការកក់ទុក')}</span>
          <h2 className="text-6xl md:text-9xl mb-16">{t('Transcend the', 'ឆ្លងផុតពីភាព')} <br/> <span className="italic font-light text-stone-400">{t('Ordinary.', 'សាមញ្ញ។')}</span></h2>
          <Link to="/rooms" className="luxury-button">
            {t('View Availabilities', 'មើលបន្ទប់ដែលនៅទំនេរ')}
          </Link>
        </motion.div>

      </section>
    </div>
  );
};

export default Home;
