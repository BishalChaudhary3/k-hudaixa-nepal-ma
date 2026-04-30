// ===================================================
// 💰 marketService – Nepal Gold, Silver & Forex Rates
// Uses Nepal Rastra Bank open API + fallback dummy data
// ===================================================

// Nepal Rastra Bank forex API (free, no key needed)
const NRB_FOREX_URL = 'https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=5&from=2024-01-01&to=2024-01-01';

// We use a CORS-friendly proxy approach for React Native
// NRB forex endpoint format:
const NRB_API = 'https://www.nrb.org.np/api/forex/v1/app-rate';

// ─── Realistic dummy data (updated manually or via automation) ──
const DUMMY_MARKET = {
  gold: {
    fine_np: 143500,       // per tola (fine gold 24k) in NPR
    tejabi_np: 143000,     // per tola (tejabi 22k) in NPR
    fine_change: +850,
    tejabi_change: +720,
  },
  silver: {
    per_tola_np: 1680,    // per tola in NPR
    change: +15,
  },
  forex: [
    { code: 'USD', name_en: 'US Dollar',      name_np: 'अमेरिकी डलर',  buy: 133.05, sell: 133.65, flag: '🇺🇸' },
    { code: 'INR', name_en: 'Indian Rupee',   name_np: 'भारतीय रुपैयाँ', buy: 1.596,  sell: 1.606,  flag: '🇮🇳' },
    { code: 'EUR', name_en: 'Euro',           name_np: 'युरो',          buy: 144.21, sell: 144.89, flag: '🇪🇺' },
    { code: 'GBP', name_en: 'British Pound',  name_np: 'ब्रिटिश पाउन्ड', buy: 168.45, sell: 169.20, flag: '🇬🇧' },
    { code: 'AUD', name_en: 'Australian $',   name_np: 'अस्ट्रेलियन डलर', buy: 85.30,  sell: 85.72,  flag: '🇦🇺' },
    { code: 'CNY', name_en: 'Chinese Yuan',   name_np: 'चिनियाँ युआन',  buy: 18.32,  sell: 18.41,  flag: '🇨🇳' },
    { code: 'AED', name_en: 'UAE Dirham',     name_np: 'यूएई दिर्हाम',  buy: 36.22,  sell: 36.42,  flag: '🇦🇪' },
    { code: 'SAR', name_en: 'Saudi Riyal',    name_np: 'साउदी रियाल',   buy: 35.45,  sell: 35.63,  flag: '🇸🇦' },
    { code: 'JPY', name_en: 'Japanese Yen',   name_np: 'जापानी येन',    buy: 0.884,  sell: 0.888,  flag: '🇯🇵' },
    { code: 'QAR', name_en: 'Qatari Riyal',   name_np: 'कतारी रियाल',   buy: 36.55,  sell: 36.75,  flag: '🇶🇦' },
  ],
  updated_at: new Date().toISOString(),
  source: 'Nepal Rastra Bank',
};

/**
 * Fetch live forex rates from NRB API
 * Falls back to dummy data if request fails
 */
export async function fetchMarketData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url   = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=20&from=${today}&to=${today}`;

    const res  = await fetch(url, { timeout: 8000 });
    const json = await res.json();

    // NRB API response structure
    const rates = json?.data?.payload?.[0]?.rates || [];

    if (rates.length === 0) return DUMMY_MARKET;

    // Map NRB response to our format
    const WANTED  = ['USD','INR','EUR','GBP','AUD','CNY','AED','SAR','JPY','QAR'];
    const FLAGS   = { USD:'🇺🇸',INR:'🇮🇳',EUR:'🇪🇺',GBP:'🇬🇧',AUD:'🇦🇺',CNY:'🇨🇳',AED:'🇦🇪',SAR:'🇸🇦',JPY:'🇯🇵',QAR:'🇶🇦' };
    const NAMES_EN = { USD:'US Dollar',INR:'Indian Rupee',EUR:'Euro',GBP:'British Pound',AUD:'Australian $',CNY:'Chinese Yuan',AED:'UAE Dirham',SAR:'Saudi Riyal',JPY:'Japanese Yen',QAR:'Qatari Riyal' };
    const NAMES_NP = { USD:'अमेरिकी डलर',INR:'भारतीय रुपैयाँ',EUR:'युरो',GBP:'ब्रिटिश पाउन्ड',AUD:'अस्ट्रेलियन डलर',CNY:'चिनियाँ युआन',AED:'यूएई दिर्हाम',SAR:'साउदी रियाल',JPY:'जापानी येन',QAR:'कतारी रियाल' };

    const forex = WANTED.map(code => {
      const r = rates.find(x => x.currency?.iso3 === code);
      if (!r) return DUMMY_MARKET.forex.find(x => x.code === code);
      // NRB buy/sell are per unit; INR is per 100
      const divisor = code === 'INR' ? 100 : 1;
      return {
        code,
        name_en: NAMES_EN[code],
        name_np: NAMES_NP[code],
        buy:  parseFloat((r.buy  / divisor).toFixed(3)),
        sell: parseFloat((r.sell / divisor).toFixed(3)),
        flag: FLAGS[code],
      };
    }).filter(Boolean);

    return {
      ...DUMMY_MARKET,
      forex,
      updated_at: new Date().toISOString(),
    };
  } catch (e) {
    console.warn('Market fetch failed, using dummy data:', e.message);
    return DUMMY_MARKET;
  }
}

// ─── Format helpers ─────────────────────────────────
const NP_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];
function toNP(n) {
  return String(Math.round(n)).replace(/\d/g, d => NP_DIGITS[d]);
}

export function formatGoldPrice(market, isNepali) {
  const { fine_np, tejabi_np, fine_change, tejabi_change } = market.gold;
  const arrow = fine_change >= 0 ? '▲' : '▼';
  if (isNepali) {
    return {
      fine:         `रु. ${toNP(fine_np)}`,
      tejabi:       `रु. ${toNP(tejabi_np)}`,
      change:       `${arrow} ${toNP(Math.abs(fine_change))}`,
      isUp:         fine_change >= 0,
      label_fine:   'सुन (२४क)',
      label_tejabi: 'सुन (२२क)',
      unit:         'प्रति तोला',
    };
  }
  return {
    fine:         `Rs. ${fine_np.toLocaleString()}`,
    tejabi:       `Rs. ${tejabi_np.toLocaleString()}`,
    change:       `${arrow} ${Math.abs(fine_change).toLocaleString()}`,
    isUp:         fine_change >= 0,
    label_fine:   'Gold (24k)',
    label_tejabi: 'Gold (22k)',
    unit:         'per tola',
  };
}

export function formatSilverPrice(market, isNepali) {
  const { per_tola_np, change } = market.silver;
  const arrow = change >= 0 ? '▲' : '▼';
  if (isNepali) {
    return {
      price:  `रु. ${toNP(per_tola_np)}`,
      change: `${arrow} ${toNP(Math.abs(change))}`,
      isUp:   change >= 0,
      label:  'चाँदी',
      unit:   'प्रति तोला',
    };
  }
  return {
    price:  `Rs. ${per_tola_np.toLocaleString()}`,
    change: `${arrow} ${Math.abs(change)}`,
    isUp:   change >= 0,
    label:  'Silver',
    unit:   'per tola',
  };
}