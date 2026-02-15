import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createBookingRequest } from '../services/api';
import useLanguage from '../hooks/useLanguage';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!roomInfo.roomUuid) navigate('/rooms');
    window.scrollTo(0, 0);
  }, [roomInfo.roomUuid, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await createBookingRequest(formData);
      setRef(res.data.bookingReference);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'success') return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-8">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl w-full glass-card p-16 text-center space-y-10"
      >
        <div className="w-20 h-20 bg-stone-50 rounded-full mx-auto flex items-center justify-center text-black">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-serif">Request Initiated.</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Your residential inquiry has been received. Our concierge will review your profile and contact you via your provided credentials.
          </p>
        </div>
        <div className="p-8 border border-stone-800 bg-black/40">
          <span className="text-[10px] tracking-[0.4em] text-stone-500 uppercase block mb-2">Reference Portfolio</span>
          <span className="text-xl font-serif text-stone-100 uppercase tracking-widest">{ref || 'PROCESSING'}</span>
        </div>
        <button onClick={() => navigate('/')} className="luxury-button w-full">Return to Zenith</button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] pt-40 pb-20 px-8 lg:px-24">
      <div className="grain" />
      
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Summary Info */}
        <div className="lg:col-span-5 space-y-16">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <span className="text-stone-500 tracking-[0.5em] uppercase text-[9px] block mb-8 font-bold flex items-center gap-4">
              <span className="khmer-font tracking-normal font-normal">ជំហានចុងក្រោយ</span>
              <span className="w-8 h-px bg-stone-800" />
              <span>Initiating Reservation</span>
            </span>
            <h1 className="text-6xl md:text-7xl leading-none font-serif mb-12 italic">The <br/> {roomInfo.roomType}</h1>
            <div className="h-px w-32 bg-stone-700" />
          </motion.div>

          <div className="space-y-10">
             <div className="flex justify-between items-end border-b border-stone-900 pb-6">
                <span className="text-stone-500 text-[10px] uppercase tracking-[0.4em]">Base Nightly</span>
                <span className="text-2xl font-serif text-stone-100">${roomInfo.price?.toLocaleString()}</span>
             </div>
             <p className="text-stone-500 text-sm leading-relaxed italic khmer-font tracking-normal">
               សូមផ្តល់ព័ត៌មានអត្តសញ្ញាណប័ណ្ណផ្លូវការរបស់អ្នក។ អេលីសៀន រក្សាពិធីការឯកជនភាពយ៉ាងតឹងរ៉ឹងបំផុត។
             </p>
          </div>
        </div>

        {/* Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-7"
        >
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block group-focus-within:text-stone-100 transition-colors font-bold">{t('Legal Full Name', 'ឈ្មោះពេញផ្លូវការ')}</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all font-light text-stone-100"
                  onChange={e => setFormData({...formData, guest_name: e.target.value})}
                />
              </div>
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block group-focus-within:text-stone-100 transition-colors font-bold">{t('Official Contact', 'លេខទូរស័ព្ទផ្លូវការ')}</label>
                <input 
                  type="tel" 
                  required
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all font-light text-stone-100"
                  onChange={e => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block group-focus-within:text-stone-100 transition-colors font-bold">{t('Telegram Handle', 'គណនីតេឡេក្រាម')}</label>
                <input 
                  type="text" 
                  placeholder="@username"
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all font-light text-stone-100"
                  onChange={e => setFormData({...formData, telegram: e.target.value})}
                />
              </div>
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block group-focus-within:text-stone-100 transition-colors font-bold">{t('Email Address', 'អាសយដ្ឋានអ៊ីមែល')}</label>
                <input 
                  type="email" 
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all font-light text-stone-100"
                  onChange={e => setFormData({...formData, guest_email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block font-bold">{t('Arrival Date', 'ថ្ងៃចូលស្នាក់នៅ')}</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all text-stone-400"
                  onChange={e => setFormData({...formData, check_in_date: e.target.value})}
                />
              </div>
              <div className="group relative">
                <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block font-bold">{t('Departure Date', 'ថ្ងៃចេញពីស្នាក់នៅ')}</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-stone-100 transition-all text-stone-400"
                  onChange={e => setFormData({...formData, check_out_date: e.target.value})}
                />
              </div>
            </div>

            <div className="group relative">
              <label className="text-xs uppercase tracking-[0.1em] text-stone-500 mb-3 block font-bold">{t('Bespoke Requirements', 'តម្រូវការពិសេស')}</label>
              <textarea 
                rows="4"
                placeholder={t("Pillow preference, dietary restrictions, vault access...", "ចំណូលចិត្តខ្នើយ ការរឹតត្បិតរបបអាហារ ការចូលប្រើតុដេក...")}
                className="w-full bg-transparent border border-stone-800 p-6 focus:outline-none focus:border-stone-100 transition-all font-light text-sm italic text-stone-200"
                onChange={e => setFormData({...formData, special_requests: e.target.value})}
              />
            </div>

            <button 
              disabled={status === 'loading'}
              className="luxury-button w-full flex items-center justify-center gap-4 group"
            >
              {status === 'loading' ? t('Encrypting Data...', 'កំពុងរក្សាទុកទិន្នន័យ...') : t('Submit Inquiry', 'បញ្ជូនសំណើ')}
              <span className="w-8 h-px bg-current group-hover:w-16 transition-all" />
            </button>
            
            {status === 'error' && (
              <p className="text-red-400 text-[10px] uppercase tracking-widest text-center mt-4 font-bold">System error: Connection failure</p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Booking;
