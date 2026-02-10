import React from 'react';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <div className="flex items-center gap-8 mb-16 border-b border-zinc-100 pb-12">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-white text-3xl font-serif">
          JD
        </div>
        <div>
          <h1 className="text-3xl font-serif">Julian De-Vinci</h1>
          <p className="text-zinc-500">Member since 2024 • Preferred Guest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-4">
            <button className="w-full text-left font-bold text-sm uppercase tracking-widest text-gold border-l-2 border-gold pl-4">Account Overview</button>
            <button className="w-full text-left font-bold text-sm uppercase tracking-widest text-zinc-400 hover:text-zinc-900 pl-4 transition-colors">Booking History</button>
            <button className="w-full text-left font-bold text-sm uppercase tracking-widest text-zinc-400 hover:text-zinc-900 pl-4 transition-colors">Preferences</button>
            <button className="w-full text-left font-bold text-sm uppercase tracking-widest text-red-400 pl-4 transition-colors mt-12">Sign Out</button>
        </div>

        <div className="md:col-span-2">
            <div className="p-8 border border-zinc-100 rounded-lg">
                <h3 className="font-serif text-2xl mb-6">Upcoming Stays</h3>
                <div className="text-center py-12 bg-zinc-50 border border-dashed border-zinc-200">
                    <p className="text-zinc-400 text-sm">No upcoming reservations found.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
