// ===================================================
// 🌐 useLanguage – Global Language Context
// ===================================================

import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Default: Nepali ('np')
  const [language, setLanguage] = useState('np');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'np' ? 'en' : 'np'));
  };

  const isNepali = language === 'np';

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, isNepali }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default useLanguage;
