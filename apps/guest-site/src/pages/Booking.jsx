import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createBookingRequest } from '../services/api';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roomInfo = location.state || {};

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    phone_number: '',
    telegram: '',
    check_in_date: '',
    check_out_date: '',
    special_requests: '',
    room_uuid: roomInfo.roomUuid || ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBookingRequest(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="text-amber-200 tracking-[0.4em] uppercase text-[10px] block mb-6">Reservation Pending</span>
          <h2 className="text-5xl font-serif text-stone-50 mb-8">Thank You, {formData.guest_name.split(' ')[0]}.</h2>
          <p className="text-stone-400 mb-12 max-w-md mx-auto leading-relaxed">
            Our concierge will contact you via <span className="text-stone-50">Telegram (@{formData.telegram})</span> or phone to confirm your stay.
          </p>
          <button onClick={() => navigate('/')} className="luxury-button">
            Return to Elysian
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen pt-40 pb-20 px-6 flex flex-col items-center">
      <div className="grain" />
      
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-amber-200/60 tracking-[0.4em] uppercase text-[10px] block mb-4">The Final Step</span>
            <h1 className="text-5xl md:text-7xl mb-12 italic font-light">Confirm Your <br/>Stay.</h1>
            
            <div className="p-12 border border-stone-800 bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-6 font-bold">Residency Selection</h3>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-3xl font-serif text-stone-50 mb-1">{roomInfo.roomType || 'Standard Selection'}</p>
                        <p className="text-stone-500 text-xs">Curated Guest Residence</p>
                    </div>
                    <p className="text-amber-200 font-serif text-2xl">${roomInfo.price || 0}</p>
                </div>
                <div className="h-px bg-stone-800 w-full mb-8" />
                <p className="text-stone-400 text-sm leading-relaxed">
                    Once submitted, our team will verify availability. We prioritize contact via Telegram for faster confirmation.
                </p>
            </div>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-12"
          >
            <div className="space-y-8">
                <div className="group">
                    <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Your Name</label>
                    <input 
                        type="text" required placeholder="ALEXANDER VANCE"
                        className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50 uppercase tracking-widest"
                        value={formData.guest_name}
                        onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-12">
                  <div className="group">
                      <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Telegram Handle</label>
                      <input 
                          type="text" required placeholder="@USERNAME"
                          className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50 uppercase tracking-widest"
                          value={formData.telegram}
                          onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                      />
                  </div>
                  <div className="group">
                      <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Phone Number</label>
                      <input 
                          type="tel" required placeholder="+855 ..."
                          className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50 uppercase tracking-widest"
                          value={formData.phone_number}
                          onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      />
                  </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Email Address (Optional)</label>
                    <input 
                        type="email"
                        placeholder="VANCE@HOTMAIL.COM"
                        className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50 uppercase tracking-widest"
                        value={formData.guest_email}
                        onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div className="group">
                        <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Arrival</label>
                        <input 
                            type="date" required
                            className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50"
                            value={formData.check_in_date}
                            onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Departure</label>
                        <input 
                            type="date" required
                            className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-amber-200 text-stone-50"
                            value={formData.check_out_date}
                            onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                        />
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] uppercase tracking-[0.4em] mb-4 text-stone-500 group-focus-within:text-amber-200 transition-colors">Special Requests</label>
                    <textarea 
                        className="w-full bg-transparent border border-stone-800 p-4 focus:outline-none focus:border-amber-200 text-stone-50 h-32"
                        value={formData.special_requests}
                        onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                    />
                </div>
            </div>
            
            <button type="submit" className="w-full luxury-button bg-stone-50 text-zinc-950 font-bold hover:bg-amber-200">
                Submit Reservation Request
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Booking;
