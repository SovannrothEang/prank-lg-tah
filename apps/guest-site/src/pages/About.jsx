import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const About = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <div className="bg-[#080808] min-h-screen overflow-hidden">
      <div className="grain" />
      
      {/* Editorial Header */}
      <section className="relative h-[80vh] flex items-center px-8 lg:px-24 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=2074&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale"
            alt="Heritage"
          />
        </motion.div>

        <div className="relative z-10 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            className="text-[10px] uppercase tracking-[0.8em] text-stone-200 block mb-12 font-bold"
          >
            ESTABLISHED MCMXXIV
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1.2 }}
            className="text-7xl md:text-[10rem] leading-[0.9] font-serif mb-12 tracking-tighter"
          >
            The Art of <br/> <span className="italic font-light text-stone-400">Atmosphere.</span>
          </motion.h1>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-60 px-8 lg:px-24">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
          <div className="lg:col-span-7 space-y-24">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <h2 className="text-4xl md:text-7xl font-serif leading-[1.1]">
                We believe that true luxury is not found in excess, but in the <span className="italic text-stone-500 font-light text-reveal">curated absence</span> of noise.
              </h2>
              <div className="h-px w-40 bg-stone-800" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-stone-500 text-lg leading-relaxed font-light italic">
                <p>
                  Founded on the principles of quietude and master-craftsmanship, Elysian was conceived as a response to the chaotic acceleration of the modern world.
                </p>
                <p>
                  Every stone in our architecture, every thread in our linens, and every note in our olfactory environment is chosen with singular intentionality.
                </p>
              </div>
            </motion.div>

            <motion.div 
              style={{ y }}
              className="aspect-[16/9] overflow-hidden bg-zinc-900 shadow-2xl"
            >
               <img 
                src="https://images.unsplash.com/photo-1495433331362-d265172b0916?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s] hover:scale-105"
                alt="Architecture Detail"
              />
            </motion.div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-16 space-y-12"
            >
              <h3 className="text-3xl font-serif italic text-stone-200">The Pillars</h3>
              <div className="space-y-10">
                {[
                  { t: "CRAFTSMANSHIP", d: "Traditional techniques meeting avant-garde aesthetics." },
                  { t: "DISCRETION", d: "Your privacy is our most guarded commodity." },
                  { t: "EQUILIBRIUM", d: "Designing spaces that restore the human spirit." }
                ].map((p, i) => (
                  <div key={i} className="group">
                    <span className="text-[9px] tracking-[0.5em] text-stone-500 block mb-2 group-hover:text-stone-200 transition-colors">{p.t}</span>
                    <p className="text-sm text-stone-400 font-light leading-relaxed">{p.d}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Full Width Visual */}
      <section className="h-[70vh] px-8 lg:px-24 mb-60">
        <motion.div 
           initial={{ clipPath: "inset(0% 10% 0% 10%)" }}
           whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
           viewport={{ once: true }}
           transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
           className="w-full h-full overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1600607687940-c52af0369996?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale hover:scale-105 transition-transform duration-[3s]"
            alt="Interior"
          />
        </motion.div>
      </section>
    </div>
  );
};

export default About;
