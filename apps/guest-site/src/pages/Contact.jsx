import React from 'react';

const Contact = () => {
  return (
    <div className="py-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
            <h1 className="text-5xl font-serif mb-8">Connect With Us</h1>
            <p className="text-zinc-600 mb-12">Whether you are looking to plan a stay, host an event, or simply want to learn more about our amenities, our team is at your service.</p>
            
            <div className="space-y-8">
                <div>
                    <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mb-2">Location</h4>
                    <p className="font-serif text-lg">122 Luxury Way, Paris, France</p>
                </div>
                <div>
                    <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mb-2">Reservations</h4>
                    <p className="font-serif text-lg">+33 (0) 1 23 45 67 89</p>
                    <p className="font-serif text-lg">stay@elysianhotel.com</p>
                </div>
            </div>
        </div>

        <form className="bg-zinc-50 p-12 space-y-6">
            <input type="text" placeholder="Name" className="w-full bg-transparent border-b border-zinc-300 py-4 focus:outline-none focus:border-zinc-900" />
            <input type="email" placeholder="Email" className="w-full bg-transparent border-b border-zinc-300 py-4 focus:outline-none focus:border-zinc-900" />
            <textarea placeholder="Your Message" rows="4" className="w-full bg-transparent border-b border-zinc-300 py-4 focus:outline-none focus:border-zinc-900" />
            <button className="px-10 py-4 bg-zinc-900 text-white uppercase tracking-widest text-sm hover:bg-gold transition-colors">Send Inquiry</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
