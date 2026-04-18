// ===================================================
// 🗂️ Categories – Single source of truth
// ===================================================

export const CATEGORIES = [
    {
      id: 'all',
      label_en: 'All',
      label_np: 'सबै',
      color: '#C1121F',
    },
    {
      id: 'infrastructure',
      label_en: 'Infrastructure',
      label_np: 'पूर्वाधार',
      color: '#EA580C',
    },
    {
      id: 'sports',
      label_en: 'Sports',
      label_np: 'खेलकुद',
      color: '#16A34A',
    },
    {
      id: 'technology',
      label_en: 'Technology',
      label_np: 'प्रविधि',
      color: '#0284C7',
    },
    {
      id: 'agriculture',
      label_en: 'Agriculture',
      label_np: 'कृषि',
      color: '#65A30D',
    },
    {
      id: 'tourism',
      label_en: 'Tourism',
      label_np: 'पर्यटन',
      color: '#D97706',
    },
    {
      id: 'foreign_affairs',
      label_en: 'Foreign Affairs',
      label_np: 'विदेश मामिला',
      color: '#4F46E5',
    },
    {
      id: 'economy',
      label_en: 'Economy',
      label_np: 'अर्थतन्त्र',
      color: '#059669',
    },
    {
      id: 'education',
      label_en: 'Education',
      label_np: 'शिक्षा',
      color: '#7C3AED',
    },
    {
      id: 'cabinet',
      label_en: 'Cabinet',
      label_np: 'मन्त्रिमण्डल',
      color: '#9333EA',
    },
    {
      id: 'Opportunity',
      label_en: 'Opportunity',
      label_np: 'अवसर',
      color: '#9333EA',
    }
  ];
  
  // Helper: get a category object by id
  export function getCategoryById(id) {
    return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
  }
  
  // Helper: get label in current language
  export function getCategoryLabel(id, isNepali) {
    const cat = getCategoryById(id);
    return isNepali ? cat.label_np : cat.label_en;
  }