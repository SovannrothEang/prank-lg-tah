import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { guestLogin } from '../services/api';

const Profile = () => {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if already "logged in" in session
  useEffect(() => {
    const saved = localStorage.getItem('elysian_guest_phone');
    if (saved) handleLogin(saved);
  }, []);

  const handleLogin = async (phoneToUse) => {
    setLoading(true);
    setError(null);
    try {
      const res = await guestLogin(phoneToUse || phone);
      setData(res.data);
      localStorage.setItem('elysian_guest_phone', phoneToUse || phone);
    } catch (err) {
      setError('Guest profile not found. Please verify your contact details.');
      localStorage.removeItem('elysian_guest_phone');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('elysian_guest_phone');
    setData(null);
  };

  const getTier = (spend) => {
    if (spend >= 5000) return 'Elite Member';
    if (spend >= 2000) return 'Preferred Guest';
    return 'Classic Resident';
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#080808] pt-60 px-8 flex justify-center">
        <div className="grain" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12"
        >
          <div className="text-center space-y-4">
            <span className="text-[10px] tracking-[0.8em] text-stone-500 uppercase block font-bold">Private Access</span>
            <h1 className="text-6xl font-serif">Resident <br/> <span className="italic font-light text-stone-400">Portal.</span></h1>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-8 glass-card p-10">
            <div className="group relative">
              <label className="text-[9px] uppercase tracking-[0.4em] text-stone-500 mb-2 block group-focus-within:text-stone-100 transition-colors">Official Contact Number</label>
              <input 
                type="tel" 
                required
                placeholder="+855 ..."
                className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all text-stone-200 font-light"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button className="luxury-button w-full" disabled={loading}>
              {loading ? 'Verifying Identity...' : 'Access Profile'}
            </button>
            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}
          </form>
        </motion.div>
      </div>
    );
  }

  const { guest, stays } = data;
  const initials = guest.full_name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[#080808] pt-40 pb-20 px-8 lg:px-24">
      <div className="grain" />
      
      <div className="max-w-[1400px] mx-auto space-y-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-12 border-b border-stone-900 pb-16">
          <div className="w-32 h-32 bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-200 text-4xl font-serif relative overflow-hidden group">
            <div className="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-5 transition-opacity" />
            {initials}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-serif mb-4">{guest.full_name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-stone-500 text-[10px] uppercase tracking-[0.4em]">
              <span>Member Since {new Date(guest.created_at).getFullYear()}</span>
              <span className="text-stone-100 font-bold">{guest.is_vip ? 'VIP STATUS' : getTier(guest.total_spend || 0)}</span>
              <span className="text-stone-300 italic">${(guest.total_spend || 0).toLocaleString()} Spent</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Navigation */}
          <div className="lg:col-span-3 space-y-4">
             <div className="text-[9px] tracking-[0.5em] text-stone-600 mb-8 uppercase font-bold">Residency Management</div>
             <button className="w-full text-left text-[10px] uppercase tracking-[0.4em] text-stone-100 border-l border-stone-100 pl-6 py-2">Overview</button>
             <button className="w-full text-left text-[10px] uppercase tracking-[0.4em] text-stone-500 hover:text-stone-300 pl-6 py-2 transition-colors">Digital Vault</button>
             <button className="w-full text-left text-[10px] uppercase tracking-[0.4em] text-stone-500 hover:text-stone-300 pl-6 py-2 transition-colors">Preferences</button>
             <button 
              onClick={handleSignOut}
              className="w-full text-left text-[10px] uppercase tracking-[0.4em] text-red-400/60 hover:text-red-400 pl-6 py-2 transition-colors mt-20"
             >
               Sign Out
             </button>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 space-y-12">
            <div className="glass-card p-12 lg:p-16">
              <h3 className="font-serif text-3xl mb-12 italic">Residential History</h3>
              
              <div className="space-y-12">
                {stays.map((stay, i) => (
                  <motion.div 
                    key={stay.uuid}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-900 pb-10"
                  >
                    <div>
                      <span className="text-[9px] tracking-[0.4em] text-stone-500 block mb-2 uppercase">Room {stay.room_number}</span>
                      <h4 className="text-2xl font-serif text-stone-200 mb-1">{stay.type_name}</h4>
                      <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em]">
                        {stay.check_in_date} &mdash; {stay.check_out_date}
                      </p>
                    </div>
                    <div className="text-left md:text-right space-y-2">
                       <span className={`inline-block text-[8px] tracking-[0.4em] px-3 py-1 uppercase border ${stay.status === 'checked_out' ? 'border-stone-800 text-stone-600' : 'border-stone-100 text-stone-100'}`}>
                        {stay.status}
                       </span>
                       <div className="text-xl font-serif text-stone-300">${stay.total_price.toLocaleString()}</div>
                    </div>
                  </motion.div>
                ))}

                {stays.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-stone-900">
                    <p className="text-stone-600 font-serif italic text-xl">No residency records found in the archive.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-12 border border-stone-900 space-y-4">
                  <span className="text-[9px] tracking-[0.4em] text-stone-500 block uppercase">Dining Preference</span>
                  <p className="text-stone-300 font-light italic">Vintage wine collection curated for your palate.</p>
               </div>
               <div className="p-12 border border-stone-900 space-y-4">
                  <span className="text-[9px] tracking-[0.4em] text-stone-500 block uppercase">Concierge Note</span>
                  <p className="text-stone-300 font-light italic">Preferred late checkout at 14:00.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
