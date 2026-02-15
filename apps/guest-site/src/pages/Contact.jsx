import React from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  return (
    <div className="bg-[#080808] min-h-screen pt-40 lg:pt-60 pb-40 px-8 lg:px-24">
      <div className="grain" />
      
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Contact info */}
        <div className="lg:col-span-5 space-y-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-[10px] tracking-[0.8em] text-stone-500 uppercase block mb-10 font-bold">Concierge Service</span>
            <h1 className="text-7xl md:text-9xl leading-[0.9] font-serif tracking-tighter mb-12">
              At Your <br/> <span className="italic font-light text-stone-400 text-reveal">Disposal.</span>
            </h1>
          </motion.div>

          <div className="space-y-16">
            <motion.div
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               className="group"
            >
              <span className="text-[9px] tracking-[0.5em] text-stone-600 block mb-6 uppercase">The Address</span>
              <p className="text-2xl font-serif text-stone-200 group-hover:italic transition-all duration-700">Rue du Faubourg Saint-Honoré, <br/> 75008 Paris, France</p>
            </motion.div>

            <motion.div
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="group"
            >
              <span className="text-[9px] tracking-[0.5em] text-stone-600 block mb-6 uppercase">Voice & Digital</span>
              <p className="text-2xl font-serif text-stone-200">+33 (0) 1 88 44 22 11</p>
              <p className="text-xl font-serif text-stone-400 italic">concierge@elysian.fr</p>
            </motion.div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-7 flex items-end">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full glass-card p-12 lg:p-20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <h2 className="text-[20vw] font-serif italic">E</h2>
            </div>

            <form className="space-y-12 relative z-10" onSubmit={(e) => e.preventDefault()}>
               <div className="group relative">
                <label className="text-[9px] uppercase tracking-[0.4em] text-stone-500 mb-2 block group-focus-within:text-stone-100 transition-colors">Official Name</label>
                <input 
                  type="text" 
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all text-stone-200 font-light"
                />
              </div>
              
              <div className="group relative">
                <label className="text-[9px] uppercase tracking-[0.4em] text-stone-500 mb-2 block group-focus-within:text-stone-100 transition-colors">Digital Correspondence</label>
                <input 
                  type="email" 
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all text-stone-200 font-light"
                />
              </div>

              <div className="group relative">
                <label className="text-[9px] uppercase tracking-[0.4em] text-stone-500 mb-2 block group-focus-within:text-stone-100 transition-colors">Your Narrative</label>
                <textarea 
                  rows="5"
                  className="w-full bg-transparent border border-stone-800 p-6 focus:outline-none focus:border-stone-100 transition-all text-stone-200 font-light italic text-sm"
                  placeholder="How may we curate your arrival?"
                />
              </div>

              <button className="luxury-button w-full flex items-center justify-between group">
                <span className="tracking-[0.8em]">Dispatch Inquiry</span>
                <span className="w-12 h-px bg-current group-hover:w-24 transition-all duration-700" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
