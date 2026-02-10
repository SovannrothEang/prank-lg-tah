import React from 'react';

const About = () => {
  return (
    <div className="py-20 px-4 max-w-4xl mx-auto">
      <h1 className="text-5xl font-serif mb-12 text-center">Our Legacy</h1>
      <div className="aspect-video mb-12">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover" alt="Hotel Exterior" />
      </div>
      <div className="prose prose-lg text-zinc-600 space-y-6">
        <p>Founded in 1924, the Elysian has stood as a beacon of luxury for over a century. Originally built as a private residence, it was transformed into a boutique hotel that has hosted royalty, dignitaries, and artists from around the world.</p>
        <p>Our philosophy is simple: quiet luxury. We believe that true hospitality is felt, not seen. Our staff is trained to anticipate your needs before you even realize them yourself.</p>
      </div>
    </div>
  );
};

export default About;
