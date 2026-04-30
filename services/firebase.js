// ===================================================
// 🔥 Firebase Service – Firestore Integration
// ===================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project named "ke-hudai-cha-nepal"
// 3. Add a Web App to your project
// 4. Copy your firebaseConfig values below
// 5. Enable Firestore Database (start in test mode)
// 6. Run the seedDummyData() function once to populate data
// ===================================================

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

// 🔧 REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================================================
// 📰 DUMMY NEWS DATA (10 realistic Nepal govt news)
// ===================================================
export const DUMMY_NEWS = [
  {
    title_np: "मन्त्रिपरिषद्को निर्णय: बिजुली महसुल नबढाउने",
    summary_np: "मन्त्रिपरिषद्को आजको बैठकले आगामी छ महिनासम्म बिजुलीको महसुल नबढाउने निर्णय गरेको छ। यो निर्णयबाट आम उपभोक्तालाई राहत मिल्ने अपेक्षा गरिएको छ। ऊर्जा मन्त्रालयले शीघ्रै अधिकारिक सूचना जारी गर्नेछ।",
    title_en: "Cabinet Decision: No Electricity Tariff Hike",
    summary_en: "Today's cabinet meeting decided not to increase electricity tariffs for the next six months. This decision is expected to provide relief to general consumers. The Ministry of Energy will issue an official notice shortly.",
    category: 'cabinet',
    created_at: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
  },
  {
    title_np: "प्रधानमन्त्रीले गरे राष्ट्रिय विकास समिति गठन",
    summary_np: "प्रधानमन्त्रीको अध्यक्षतामा राष्ट्रिय विकास समिति गठन गरिएको छ। यस समितिले पाँच वर्षे विकास योजनाको कार्यान्वयनको अनुगमन गर्नेछ। समितिमा १५ जना विज्ञ र मन्त्रालयका सचिवहरू समावेश छन्।",
    title_en: "PM Forms National Development Committee",
    summary_en: "A National Development Committee has been formed under the chairmanship of the Prime Minister. The committee will monitor the implementation of the five-year development plan. It includes 15 experts and ministry secretaries.",
    category: 'politics',
    created_at: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)),
  },
  {
    title_np: "शिक्षा मन्त्रालय: सरकारी विद्यालयमा निःशुल्क ट्याबलेट वितरण",
    summary_np: "शिक्षा मन्त्रालयले सरकारी माध्यमिक विद्यालयका कक्षा ९ र १० का विद्यार्थीहरूलाई निःशुल्क ट्याबलेट वितरण गर्ने घोषणा गरेको छ। यो कार्यक्रम डिजिटल नेपाल अभियानको अंश हो। पहिलो चरणमा काठमाडौँ उपत्यकाका विद्यालयहरूलाई प्राथमिकता दिइनेछ।",
    title_en: "Education Ministry: Free Tablets for Government Schools",
    summary_en: "The Ministry of Education has announced free tablet distribution for grades 9 and 10 students in government secondary schools. This program is part of the Digital Nepal campaign. Schools in the Kathmandu Valley will be prioritized in the first phase.",
    category: 'education',
    created_at: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 60 * 1000)),
  },
  {
    title_np: "नेपाल–भारत सीमा व्यवस्थापन बैठक काठमाडौँमा सम्पन्न",
    summary_np: "नेपाल र भारतबीचको सीमा व्यवस्थापन सम्बन्धी उच्चस्तरीय बैठक आज काठमाडौँमा सम्पन्न भयो। दुवै देशले खुला सीमा क्षेत्रमा अनुगमन प्रणाली सुधार गर्न सहमति जनाए। अर्को बैठक तीन महिनापछि नयाँ दिल्लीमा हुनेछ।",
    title_en: "Nepal–India Border Management Meeting Held in Kathmandu",
    summary_en: "A high-level meeting on Nepal–India border management was successfully concluded in Kathmandu today. Both nations agreed to improve monitoring systems in open border areas. The next meeting will be held in New Delhi in three months.",
    category: 'diplomacy',
    created_at: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
  },
  {
    title_np: "स्वास्थ्य मन्त्रालयको नयाँ स्वास्थ्य बीमा नीति सार्वजनिक",
    summary_np: "स्वास्थ्य मन्त्रालयले नयाँ राष्ट्रिय स्वास्थ्य बीमा नीति सार्वजनिक गरेको छ। अब प्रत्येक परिवारले वार्षिक ५ लाख रुपैयाँसम्मको उपचार सुविधा पाउनेछन्। यो नीति आगामी बैशाखदेखि लागू हुनेछ।",
    title_en: "Health Ministry Releases New Health Insurance Policy",
    summary_en: "The Ministry of Health has published a new National Health Insurance Policy. Each family will now receive treatment coverage up to Rs. 5 lakh annually. This policy will come into effect from next Baishakh.",
    category: 'health',
    created_at: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
  },
  {
    title_np: "कृषि मन्त्रालयले किसानलाई अनुदानमा बीउ उपलब्ध गराउने",
    summary_np: "कृषि तथा पशुपंक्षी विकास मन्त्रालयले यस वर्ष धान र मकैको उन्नत बीउ ५० प्रतिशत अनुदानमा उपलब्ध गराउने निर्णय गरेको छ। यसबाट लगभग ३ लाख किसान परिवार लाभान्वित हुनेछन्। वडा कार्यालयहरूमार्फत आवेदन दिन सकिनेछ।",
    title_en: "Agriculture Ministry to Provide Subsidized Seeds to Farmers",
    summary_en: "The Ministry of Agriculture and Livestock Development has decided to provide improved rice and maize seeds at 50% subsidy this year. Approximately 3 lakh farmer families will benefit from this. Applications can be submitted through ward offices.",
    category: 'agriculture',
    created_at: Timestamp.fromDate(new Date(Date.now() - 18 * 60 * 60 * 1000)),
  },
  {
    title_np: "काठमाडौँ–पोखरा द्रुतमार्गको निर्माण कार्य तीव्र पारिने",
    summary_np: "भौतिक पूर्वाधार तथा यातायात मन्त्रालयले काठमाडौँ–पोखरा द्रुतमार्गको निर्माण कार्यलाई थप तीव्र पार्ने घोषणा गरेको छ। अर्को वर्षसम्म ४० प्रतिशत काम सम्पन्न गर्ने लक्ष्य राखिएको छ। यो मार्ग पूरा भएपछि काठमाडौँबाट पोखरा ४ घण्टामा पुग्न सकिनेछ।",
    title_en: "Kathmandu–Pokhara Expressway Construction to Be Accelerated",
    summary_en: "The Ministry of Physical Infrastructure has announced acceleration of the Kathmandu–Pokhara Expressway construction. A target has been set to complete 40% of the work by next year. Once complete, Pokhara will be reachable from Kathmandu in 4 hours.",
    category: 'infrastructure',
    created_at: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  },
  {
    title_np: "संसद्को विशेष अधिवेशन: बजेट संशोधन पास",
    summary_np: "संघीय संसद्को विशेष अधिवेशनमा चालु आर्थिक वर्षको बजेट संशोधन विधेयक पास भएको छ। स्वास्थ्य र शिक्षा क्षेत्रमा थप ३० अर्ब रुपैयाँ बजेट थपिएको छ। यो संशोधनले सामाजिक सुरक्षा कार्यक्रमहरूलाई बल दिनेछ।",
    title_en: "Special Parliament Session: Budget Amendment Passed",
    summary_en: "The budget amendment bill for the current fiscal year has been passed in a special session of the Federal Parliament. An additional Rs. 30 billion has been allocated to health and education. This amendment will strengthen social security programs.",
    category: 'parliament',
    created_at: Timestamp.fromDate(new Date(Date.now() - 36 * 60 * 60 * 1000)),
  },
  {
    title_np: "महिला आयोगको प्रतिवेदन: कार्यस्थलमा महिला सुरक्षा बढाउन सिफारिस",
    summary_np: "राष्ट्रिय महिला आयोगले कार्यस्थलमा महिला सुरक्षा सम्बन्धी वार्षिक प्रतिवेदन सार्वजनिक गरेको छ। प्रतिवेदनमा सरकारी कार्यालयहरूमा यौन दुर्व्यवहार उजुरी इकाई स्थापना गर्न सिफारिस गरिएको छ। मन्त्रिपरिषद्ले यस सिफारिसमाथि तीन महिनाभित्र निर्णय लिनुपर्नेछ।",
    title_en: "Women's Commission Report: Recommendations to Improve Workplace Safety",
    summary_en: "The National Women's Commission has published its annual report on women's safety in workplaces. The report recommends establishing sexual harassment complaint units in government offices. The cabinet must make a decision on these recommendations within three months.",
    category: 'politics',
    created_at: Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
  },
  {
    title_np: "पर्यटन वर्ष २०२५: नेपाल आउने पर्यटकको संख्यामा ४०% वृद्धि",
    summary_np: "पर्यटन विभागका अनुसार पर्यटन वर्ष २०२५ को पहिलो त्रैमासिकमा नेपाल आउने विदेशी पर्यटकको संख्यामा ४० प्रतिशत वृद्धि भएको छ। भारत, चीन र अमेरिकाबाट सबैभन्दा बढी पर्यटक आएका छन्। सरकारले वार्षिक २० लाख पर्यटक भित्र्याउने लक्ष्य राखेको छ।",
    title_en: "Tourism Year 2025: 40% Rise in Tourist Arrivals to Nepal",
    summary_en: "According to the Department of Tourism, foreign tourist arrivals to Nepal increased by 40% in the first quarter of Tourism Year 2025. India, China, and the US sent the highest number of tourists. The government has set a target of attracting 2 million tourists annually.",
    category: 'tourism',
    created_at: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000 * 60)),
  },
];

// ===================================================
// 📥 FETCH NEWS FROM FIRESTORE
// ===================================================
export async function fetchNews() {
  try {
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // If Firestore is empty, return dummy data directly
      console.log('No Firestore data found. Using local dummy data.');
      return DUMMY_NEWS.map((item, index) => ({ id: String(index), ...item }));
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.warn('Firestore fetch failed, using dummy data:', error.message);
    // Fallback to local dummy data if Firebase isn't configured
    return DUMMY_NEWS.map((item, index) => ({ id: String(index), ...item }));
  }
}

// ===================================================
// 🌱 SEED DUMMY DATA INTO FIRESTORE
// Run this ONCE during initial setup
// ===================================================
export async function seedDummyData() {
  try {
    const newsRef = collection(db, 'news');
    const promises = DUMMY_NEWS.map(item => addDoc(newsRef, item));
    await Promise.all(promises);
    console.log(' Dummy data seeded successfully!');
  } catch (error) {
    console.error(' Seeding failed:', error.message);
  }
}

export { db };
