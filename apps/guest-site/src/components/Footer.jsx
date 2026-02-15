import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#080808] text-stone-500 py-32 px-8 lg:px-24 border-t border-stone-900">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-20">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-10">
          <div className="group inline-block">
            <span className="text-3xl font-serif tracking-[0.4em] uppercase text-stone-200 group-hover:text-stone-50 transition-colors duration-700">Elysian</span>
            <span className="block text-[8px] tracking-[0.8em] uppercase text-stone-600 mt-2">The Zenith of Living</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs font-light italic">
            A sanctuary for those who seek the extraordinary. Meticulously curated spaces, master-crafted experiences, and the silence of true luxury.
          </p>
        </div>

        {/* Links */}
        <div className="md:col-span-2 space-y-8">
          <span className="text-[10px] tracking-[0.4em] text-stone-200 uppercase font-bold">Discover</span>
          <div className="flex flex-col gap-4 text-xs tracking-widest font-light">
            <a href="/rooms" className="hover:text-stone-100 transition-colors">Residences</a>
            <a href="/restaurant" className="hover:text-stone-100 transition-colors">Gastronomy</a>
            <a href="/about" className="hover:text-stone-100 transition-colors">Heritage</a>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <span className="text-[10px] tracking-[0.4em] text-stone-200 uppercase font-bold">Inquiries</span>
          <div className="flex flex-col gap-4 text-xs tracking-widest font-light text-reveal">
            <a href="/contact" className="hover:text-stone-100 transition-colors">Concierge</a>
            <a href="/profile" className="hover:text-stone-100 transition-colors">Private Access</a>
            <a href="#" className="hover:text-stone-100 transition-colors">Media Kit</a>
          </div>
        </div>

        {/* Signature */}
        <div className="md:col-span-4 space-y-8 md:text-right">
          <span className="text-[10px] tracking-[0.4em] text-stone-200 uppercase font-bold">Stay Connected</span>
          <p className="text-xs tracking-[0.3em] font-light">EST. MCMXXIV — PARIS</p>
          <div className="flex md:justify-end gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <span className="text-xs tracking-widest cursor-pointer uppercase">Instagram</span>
             <span className="text-xs tracking-widest cursor-pointer uppercase">Vogue</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mt-32 pt-12 border-t border-stone-900/50 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[8px] tracking-[0.5em] uppercase text-stone-700">&copy; 2026 ELYSIAN HOTELS & RESORTS. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-10 text-[8px] tracking-[0.5em] uppercase text-stone-700">
          <a href="#" className="hover:text-stone-400">Privacy</a>
          <a href="#" className="hover:text-stone-400">Terms</a>
          <a href="#" className="hover:text-stone-400">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
