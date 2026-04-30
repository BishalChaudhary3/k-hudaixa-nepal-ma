// ===================================================
// 🗂️ Categories – Single source of truth
// ===================================================

export const CATEGORIES = [
    {
      id: 'nepal',
      label_en: 'Nepal',
      label_np: 'नेपाल',
      color: '#C1121F',
    },
    {
      id: 'world',
      label_en: 'World',
      label_np: 'विश्व',
      color: '#C1121F',
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