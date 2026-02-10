import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-zinc-950">
      <div className="grain" />
      
      {/* Cinematic Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Luxury Pool"
          />
        </motion.div>
        
        <div className="relative z-10 text-center space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <span className="text-amber-200/80 tracking-[0.6em] uppercase text-[10px] block mb-4">A Legacy of Elegance</span>
            <h1 className="text-6xl md:text-9xl font-serif text-stone-50 leading-tight">
              Quiet <span className="italic font-light">Luxury</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="flex flex-col items-center gap-8"
          >
            <Link to="/rooms" className="luxury-button">
              Begin the Journey
            </Link>
            <div className="w-px h-24 bg-gradient-to-b from-amber-200/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-40 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-6xl mb-12 leading-snug">
              Every detail is a <span className="italic font-light">masterpiece</span> in progress.
            </h2>
            <p className="text-stone-400 text-lg leading-relaxed max-w-lg mb-8">
              We do not simply offer rooms; we curate environments for significant moments. 
              The Elysian is a testament to the art of slower living, where time is the 
              ultimate amenity.
            </p>
            <Link to="/about" className="text-amber-200 text-xs tracking-widest uppercase border-b border-amber-200/30 pb-2 hover:border-amber-200 transition-all">
              Discover Our Heritage
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative aspect-[4/5] overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?q=80&w=1935&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
              alt="Detail"
            />
          </motion.div>
        </div>
      </section>

      {/* Experience Blocks */}
      <section className="bg-stone-50 py-40 px-6 text-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center mb-24">
          <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 mb-4 font-bold">The Collection</span>
          <h2 className="text-5xl md:text-7xl mb-8">Immersive Experiences</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Epicurean", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" },
            { title: "Sanctuary", img: "https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=2070&auto=format&fit=crop" },
            { title: "Venture", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" }
          ].map((exp, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="relative group h-[600px] overflow-hidden cursor-pointer"
            >
              <img src={exp.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={exp.title} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-500" />
              <div className="absolute inset-0 p-12 flex flex-col justify-end text-white">
                <h3 className="text-4xl font-serif mb-4">{exp.title}</h3>
                <span className="text-xs uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500">Explore &rarr;</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;