import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <h2 className="text-3xl font-serif tracking-widest uppercase mb-6">Elysian</h2>
          <p className="text-zinc-400 max-w-sm">A member of Leading Hotels of the World. Committed to exceptional hospitality since 1924.</p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="/rooms" className="hover:text-white transition-colors">Residences</a></li>
            <li><a href="/restaurant" className="hover:text-white transition-colors">Gastronomy</a></li>
            <li><a href="/about" className="hover:text-white transition-colors">Our History</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Follow</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Journal</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
        <span>© 2026 ELYSIAN HOTELS GROUP</span>
        <span>PRIVACY • TERMS</span>
      </div>
    </footer>
  );
};

export default Footer;
