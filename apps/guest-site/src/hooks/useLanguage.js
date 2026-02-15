import { useState, useEffect } from 'react';

const useLanguage = () => {
    const [lang, setLang] = useState(localStorage.getItem('elysian_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('elysian_lang', lang);
    }, [lang]);

    const t = (en, kh) => (lang === 'en' ? en : kh);

    return { lang, setLang, t };
};

export default useLanguage;
