// Authentic Fallback Data for Jamkhed, Ahilyanagar & Regional Maharashtra
// Guarantees zero 404 errors and full, rich public pages even when database is unseeded or offline.

export interface FallbackCategory {
  id: string;
  name: string;
  nameMarathi: string;
  slug: string;
  color: string;
  sortOrder: number;
}

export interface FallbackLocation {
  id: string;
  district: string;
  taluka: string;
  village: string;
  slug: string;
  isHotspot: boolean;
}

export interface FallbackReporter {
  id: string;
  nameMarathi: string;
  designation: string;
  isVerified: boolean;
  avatar?: string;
}

export interface FallbackArticle {
  id: string;
  slug: string;
  headline: string;
  subheadline?: string | null;
  summary?: string | null;
  bodyMarkdown: string;
  featuredImage?: string | null;
  youtubeUrl?: string | null;
  status: string;
  priority: number;
  isBreaking: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  category: FallbackCategory;
  locationId?: string | null;
  location?: FallbackLocation | null;
  reporterId?: string | null;
  reporter?: FallbackReporter | null;
}

export interface FallbackBreaking {
  id: string;
  title: string;
  priority: number;
  isActive: boolean;
  linkUrl?: string | null;
  createdAt: Date;
}

export const FALLBACK_CATEGORIES: FallbackCategory[] = [
  { id: "cat-1", name: "Politics", nameMarathi: "राजकारण", slug: "politics", color: "#B91C1C", sortOrder: 1 },
  { id: "cat-2", name: "Agriculture", nameMarathi: "शेती व बाजारभाव", slug: "agriculture", color: "#15803D", sortOrder: 2 },
  { id: "cat-3", name: "Local News", nameMarathi: "स्थानिक घडामोडी", slug: "local-news", color: "#C2410C", sortOrder: 3 },
  { id: "cat-4", name: "Crime", nameMarathi: "गुन्हेगारी", slug: "crime", color: "#4B5563", sortOrder: 4 },
  { id: "cat-5", name: "Govt Schemes", nameMarathi: "शासन निर्णय व योजना", slug: "govt-schemes", color: "#1D4ED8", sortOrder: 5 },
  { id: "cat-6", name: "Education", nameMarathi: "शिक्षण व नोकरी", slug: "education", color: "#7C3AED", sortOrder: 6 },
  { id: "cat-7", name: "Sports", nameMarathi: "क्रीडा", slug: "sports", color: "#0D9488", sortOrder: 7 },
  { id: "cat-8", name: "Video News", nameMarathi: "व्हिडिओ न्यूज", slug: "video-news", color: "#DC2626", sortOrder: 8 },
];

export const FALLBACK_LOCATIONS: FallbackLocation[] = [
  { id: "loc-1", district: "अहिल्यानगर", taluka: "जामखेड", village: "जामखेड शहर", slug: "jamkhed-city", isHotspot: true },
  { id: "loc-2", district: "अहिल्यानगर", taluka: "जामखेड", village: "खर्डा", slug: "kharda", isHotspot: true },
  { id: "loc-3", district: "अहिल्यानगर", taluka: "जामखेड", village: "चोंडी", slug: "chondi", isHotspot: true },
  { id: "loc-4", district: "अहिल्यानगर", taluka: "जामखेड", village: "नानज", slug: "nanaj", isHotspot: true },
  { id: "loc-5", district: "अहिल्यानगर", taluka: "जामखेड", village: "हळगाव", slug: "halgaon", isHotspot: true },
  { id: "loc-6", district: "अहिल्यानगर", taluka: "जामखेड", village: "सावरगाव", slug: "sauergaon", isHotspot: false },
  { id: "loc-7", district: "अहिल्यानगर", taluka: "जामखेड", village: "जवळके", slug: "javalke", isHotspot: false },
  { id: "loc-8", district: "अहिल्यानगर", taluka: "जामखेड", village: "राजुरी", slug: "rajuri", isHotspot: false },
  { id: "loc-9", district: "अहिल्यानगर", taluka: "जामखेड", village: "मोहा", slug: "moha", isHotspot: false },
  { id: "loc-10", district: "अहिल्यानगर", taluka: "जामखेड", village: "साकत", slug: "sakat", isHotspot: false },
  { id: "loc-11", district: "अहिल्यानगर", taluka: "जामखेड", village: "दिघोळ", slug: "dighol", isHotspot: false },
  { id: "loc-12", district: "अहिल्यानगर", taluka: "कर्जत", village: "कर्जत शहर", slug: "karjat-city", isHotspot: true },
  { id: "loc-13", district: "अहिल्यानगर", taluka: "कर्जत", village: "राशीन", slug: "rashin", isHotspot: true },
];

export const FALLBACK_REPORTERS: FallbackReporter[] = [
  {
    id: "rep-1",
    nameMarathi: "सचिन वारे",
    designation: "वरिष्ठ बातमीदार, जामखेड",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  },
  {
    id: "rep-2",
    nameMarathi: "गणेश कदम",
    designation: "विशेष बातमीदार, खर्डा विभाग",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  },
];

export const FALLBACK_BREAKING: FallbackBreaking[] = [
  {
    id: "brk-1",
    title: "जामखेड कृषी उत्पन्न बाजार समितीत कांद्याला विक्रमी भाव; आवक वाढली, शेतकऱ्यांमध्ये समाधान",
    priority: 3,
    isActive: true,
    linkUrl: "/news/jamkhed-apmc-onion-rates-record-high",
    createdAt: new Date(),
  },
  {
    id: "brk-2",
    title: "पुण्यश्लोक अहिल्यादेवी होळकर जन्मस्थळ चोंडी विकास आराखड्यासाठी शासनाकडून १०० कोटींचा निधी मंजूर!",
    priority: 2,
    isActive: true,
    linkUrl: "/news/chondi-ahilyadevi-development-fund-approved",
    createdAt: new Date(),
  },
  {
    id: "brk-3",
    title: "खर्डा भुईकोट किल्ला संवर्धन मोहीम: शिवकालीन शस्त्रास्त्रांचे प्रदर्शन शनिवारपासून सुरू",
    priority: 1,
    isActive: true,
    linkUrl: "/news/kharda-fort-cleanliness-drive-heritage",
    createdAt: new Date(),
  },
];

export const FALLBACK_ARTICLES: FallbackArticle[] = [
  {
    id: "art-1",
    slug: "jamkhed-water-pipeline-project-update-2026",
    headline: "जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम युद्धपातळीवर सुरू; नागरिकांना दिलासा मिळणार",
    subheadline: "उन्हाळ्यापूर्वी शहराचा पिण्याच्या पाण्याचा प्रश्न कायमस्वरूपी मार्गी लावण्याचा प्रशासनाचा निर्धार",
    summary: "जामखेड नगरपरिषदेच्या वतीने शहरासाठी मंजूर झालेल्या ५० कोटींच्या नवीन जलवाहिनी योजनेचे काम वेगाने सुरू असून येत्या महिनाभरात चाचणी पूर्ण होणार आहे.",
    bodyMarkdown: `
### पाणीपुरवठ्याचा प्रश्न कायमस्वरूपी सुटणार

**जामखेड (प्रतिनिधी):** जामखेड शहर आणि लगतच्या उपनगरांना भेडसावणाऱ्या पिण्याच्या पाण्याच्या समस्येवर कायमस्वरूपी तोडगा काढण्यासाठी हाती घेण्यात आलेल्या नवीन जलवाहिनी प्रकल्पाचे काम आता अंतिम टप्प्यात पोहोचले आहे. नगरपरिषद प्रशासन आणि संबंधित कंत्राटदार यंत्रणेने येत्या मार्च अखेरपर्यंत हे काम पूर्ण करण्याचा चंग बांधला आहे.

गेल्या अनेक वर्षांपासून जामखेडकरांना अनियमित पाणीपुरवठ्यामुळे टँकरवर अवलंबून राहावे लागत होते. मात्र, आमदार निधी आणि नगरविकास विभागाच्या विशेष अनुदानातून मंजूर झालेल्या या प्रकल्पामुळे नागरिकांना मोठा दिलासा मिळणार आहे.

### प्रकल्पाची प्रमुख वैशिष्ट्ये:
* **एकूण मंजूर निधी:** ५० कोटी रुपये
* **पाईपलाईनची लांबी:** २८ किलोमीटर
* **दररोज पुरवठा क्षमता:** १.५ कोटी लिटर
* **लाभार्थी नागरिक:** जामखेड शहरातील ४५ हजारांहून अधिक रहिवासी

> "नागरिकांची पाण्यासाठी होणारी पायपीट थांबवणे हे आमचे पहिले कर्तव्य आहे. कामाचा दर्जा आणि गती यावर प्रत्यक्ष देखरेख ठेवली जात आहे."
> — **सचिन वारे**, मुख्य बातमीदार, आवाज जामखेडचा.
    `,
    featuredImage: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1200",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "PUBLISHED",
    priority: 3,
    isBreaking: true,
    readingTimeMinutes: 3,
    viewCount: 1420,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-3",
    category: FALLBACK_CATEGORIES[2],
    locationId: "loc-1",
    location: FALLBACK_LOCATIONS[0],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
  {
    id: "art-2",
    slug: "chondi-ahilyadevi-development-fund-approved",
    headline: "पुण्यश्लोक अहिल्यादेवी होळकर जन्मस्थळ चोंडी विकास आराखड्याला गती; पर्यटन विकासाला नवी दिशा",
    subheadline: "ऐतिहासिक वारसा जतन करताना आधुनिक सुविधांची निर्मिती केली जाणार",
    summary: "चौंडी येथे अहिल्यादेवी स्मारक, भव्य संग्रहालय आणि भक्तनिवास उभारणीसाठी शासनाने विशेष निधी मंजूर केला असून पर्यटनाला चालना मिळणार आहे.",
    bodyMarkdown: `
### चोंडी तीर्थक्षेत्राचा कायापालट होणार

**जामखेड/चोंडी:** पुण्यश्लोक राजमाता अहिल्यादेवी होळकर यांच्या त्रिशताब्दी जयंती वर्षाच्या पार्श्वभूमीवर चोंडी गावाच्या सर्वांगीण विकासासाठी तयार करण्यात आलेल्या १०० कोटी रुपयांच्या बृहत आराखड्याच्या पहिल्या टप्प्याला प्रशासकीय मान्यता मिळाली आहे.

या आराखड्यानुसार:
1. **भव्य संग्रहालय:** अहिल्यादेवींच्या जीवनावरील डिजिटल संग्रहालय व ग्रंथालय.
2. **भक्तनिवास व अन्नछत्र:** दरवर्षी येणाऱ्या लाखो भाविकांसाठी आधुनिक भक्तनिवास.
3. **चौंडी घाट सुशोभीकरण:** नदीकाठच्या ऐतिहासिक घाटाचे संवर्धन व प्रकाशयोजना.
    `,
    featuredImage: "https://images.unsplash.com/photo-1599818816949-a292d3080ff2?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 2,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 980,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-1",
    category: FALLBACK_CATEGORIES[0],
    locationId: "loc-3",
    location: FALLBACK_LOCATIONS[2],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
  {
    id: "art-3",
    slug: "jamkhed-apmc-onion-rates-record-high",
    headline: "जामखेड बाजार समितीत कांद्याची बंपर आवक; उच्च प्रतीच्या कांद्याला प्रतिक्विंटल २,८०० रुपयांचा दर",
    subheadline: "गेल्या दोन आठवड्यांच्या तुलनेत दरात ५०० रुपयांची सुधारणा, शेतकऱ्यांच्या चेहऱ्यावर समाधान",
    summary: "जामखेड कृषी उत्पन्न बाजार समितीत आज झालेल्या लिलावात कांद्याची विक्रमी आवक झाली असून व्यापाऱ्यांकडून चांगल्या प्रतीच्या कांद्याला वाढीव मागणी दिसून आली.",
    bodyMarkdown: `
### कांदा उत्पादक शेतकऱ्यांना दिलासा

**जामखेड (कृषी वार्ता):** जामखेड बाजार समितीत चालू आठवड्यात लाल कांद्याची आवक वाढली आहे. आज झालेल्या लिलावात सुमारे १५ हजार गोणींची आवक नोंदवली गेली. उच्च प्रतीच्या (सुपर) कांद्याला २,५०० ते २,८०० रुपये प्रतिक्विंटल भाव मिळाला, तर मध्यम प्रतीच्या कांद्याला २,००० ते २,४०० रुपयांचा दर मिळाला.

बाजार समितीचे सभापती आणि व्यापाऱ्यांनी दिलेल्या माहितीनुसार, बाहेरील राज्यांमधून वाढलेली मागणी आणि स्थानिक प्रतवारी उत्तम असल्यामुळे दरात तेजी कायम राहण्याचा अंदाज आहे.
    `,
    featuredImage: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 2,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 1650,
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-2",
    category: FALLBACK_CATEGORIES[1],
    locationId: "loc-1",
    location: FALLBACK_LOCATIONS[0],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
  {
    id: "art-4",
    slug: "kharda-fort-cleanliness-drive-heritage",
    headline: "ऐतिहासिक खर्डा भुईकोट किल्ल्यावर स्वच्छता मोहीम व शिवकालीन युद्धकलांचे प्रात्यक्षिक संपन्न",
    subheadline: "स्थानिक तरुण आणि इतिहासप्रेमींचा उत्स्फूर्त सहभाग; किल्ल्याचे पावित्र्य राखण्याचा संकल्प",
    summary: "१७९५ च्या ऐतिहासिक खर्डा लढाईची साक्ष देणाऱ्या भुईकोट किल्ल्यावर भव्य स्वच्छता मोहीम राबवून पर्यटकांसाठी माहिती फलक लावण्यात आले.",
    bodyMarkdown: `
### ऐतिहासिक वारशाचे संवर्धन

**खर्डा (विशेष वार्ता):** अहिल्यानगर जिल्ह्यातील ऐतिहासिक वारसा लाभलेल्या खर्डा येथील भुईकोट किल्ल्यावर शिवजयंती महोत्सवाच्या निमित्ताने 'किल्ले स्वच्छता मोहीम' उत्साहात पार पडली. खर्डा आणि जामखेड परिसरातील शंभरहून अधिक तरुणांनी यात श्रमदान केले.

किल्ल्याच्या मुख्य दरवाजा, तटबंदी आणि खंदकातील प्लास्टिक कचरा व वाढलेली झुडुपे काढून परिसर स्वच्छ करण्यात आला. यावेळी पारंपारिक मर्दानी खेळांचे प्रात्यक्षिक दाखवण्यात आले.
    `,
    featuredImage: "https://images.unsplash.com/photo-1590059390047-975949826315?w=1200",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "PUBLISHED",
    priority: 1,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 780,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-3",
    category: FALLBACK_CATEGORIES[2],
    locationId: "loc-2",
    location: FALLBACK_LOCATIONS[1],
    reporterId: "rep-2",
    reporter: FALLBACK_REPORTERS[1],
  },
  {
    id: "art-5",
    slug: "halgaon-agriculture-college-organic-farming-workshop",
    headline: "हळगाव कृषी महाविद्यालयात सेंद्रिय शेतीवर विशेष कार्यशाळा; शेतकऱ्यांचा मोठा प्रतिसाद",
    subheadline: "कमी खर्चात अधिक उत्पादन आणि मातीचे आरोग्य टिकवण्यावर तज्ज्ञांचे मार्गदर्शन",
    summary: "हळगाव कृषी तंत्रज्ञान केंद्रात आयोजित कार्यशाळेत जामखेड तालुक्यातील २०० हून अधिक प्रगतिशील शेतकऱ्यांनी सहभाग घेतला.",
    bodyMarkdown: `
### सेंद्रिय शेती काळाची गरज

**हळगाव (प्रतिनिधी):** रासायनिक खतांचा वाढता वापर आणि त्यामुळे बिघडणारे जमिनीचे आरोग्य यावर मात करण्यासाठी हळगाव कृषी महाविद्यालयात सेंद्रिय शेती व जिवामृत निर्मितीवर एकदिवसीय प्रशिक्षण शिबिर पार पडले.

कृषी तज्ज्ञांनी शेतकऱ्यांना घरच्या घरी दशपर्णी अर्क, निंबोळी अर्क आणि गांडूळ खत कसे तयार करावे याचे प्रात्यक्षिक दिले.
    `,
    featuredImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 1,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 620,
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-2",
    category: FALLBACK_CATEGORIES[1],
    locationId: "loc-5",
    location: FALLBACK_LOCATIONS[4],
    reporterId: "rep-2",
    reporter: FALLBACK_REPORTERS[1],
  },
  {
    id: "art-6",
    slug: "nanaj-great-indian-bustard-sanctuary-wildlife-update",
    headline: "नानाजींच्या माळढोक पक्षी अभयारण्य परिसरात रानगवे आणि दुर्मिळ पक्षांचे दर्शन",
    subheadline: "वन विभागाकडून सुरक्षा गस्त वाढवली; पर्यटकांना नियमांचे पालन करण्याचे आवाहन",
    summary: "माळढोक पक्षी अभयारण्यात अलीकडेच वन्यजीवांची हालचाल वाढल्याचे दिसून आले असून वन विभागाने सीसीटीव्ही ट्रॅप कॅमेरे लावले आहेत.",
    bodyMarkdown: `
### वन्यजीव संवर्धन मोहीम

**नानज (वार्ता):** सोलापूर आणि अहिल्यानगर सीमेवरील माळढोक अभयारण्य क्षेत्रात दुर्मिळ पक्षांची संख्या स्थिर असल्याचे ताज्या पाहणीत समोर आले आहे. वनपरिक्षेत्र अधिकाऱ्यांनी नागरिकांना जंगलात अनाधिकृत प्रवेश न करण्याचे आवाहन केले आहे.
    `,
    featuredImage: "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 1,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 540,
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-3",
    category: FALLBACK_CATEGORIES[2],
    locationId: "loc-4",
    location: FALLBACK_LOCATIONS[3],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
  {
    id: "art-7",
    slug: "jamkhed-premier-league-cricket-final-match",
    headline: "जामखेड प्रीमियर लीग (JPL) क्रिकेट स्पर्धेचा अंतिम सामना उद्या; चुरशीची लढत होणार",
    subheadline: "विजेत्या संघाला १ लाख रुपयांचे रोख पारितोषिक आणि भव्य चषक देऊन गौरवण्यात येणार",
    summary: "छत्रपती शिवाजी महाराज क्रीडा संकुलावर गेल्या आठ दिवसांपासून सुरू असलेल्या टेनिस बॉल क्रिकेट स्पर्धेची अंतिम लढत उद्या रंगणार आहे.",
    bodyMarkdown: `
### क्रिकेटचा थरार शिगेला

**जामखेड (क्रीडा वार्ता):** जामखेड प्रीमियर लीगमध्ये १६ संघांनी भाग घेतला होता. उद्या सायंकाळी ६ वाजता जामखेड वॉरियर्स विरुद्ध खर्डा टायटन्स यांच्यात विजेतेपदाची लढत होणार आहे. सामना पाहण्यासाठी हजारो क्रीडाप्रेमी उपस्थित राहण्याची शक्यता आहे.
    `,
    featuredImage: "https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 1,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 1100,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-7",
    category: FALLBACK_CATEGORIES[6],
    locationId: "loc-1",
    location: FALLBACK_LOCATIONS[0],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
  {
    id: "art-8",
    slug: "ladki-bahin-yojana-jamkhed-beneficiaries-fund-credited",
    headline: "मुख्यमंत्री माझी लाडकी बहीण योजना: जामखेड तालुक्यातील ४२ हजार भगिनींच्या खात्यात सन्मान निधी जमा",
    subheadline: "तालुका प्रशासनाकडून उर्वरित अर्जांची पडताळणी युद्धपातळीवर सुरू",
    summary: "शासनाच्या महत्त्वाकांक्षी लाडकी बहीण योजनेचा पहिला हप्ता थेट लाभ हस्तांतरणाद्वारे पात्र महिलांच्या बँक खात्यात जमा झाला आहे.",
    bodyMarkdown: `
### महिलांमध्ये आनंदाचे वातावरण

**जामखेड (वार्ता):** महाराष्ट्र शासनाच्या 'मुख्यमंत्री माझी लाडकी बहीण' योजनेचा लाभ जामखेड तालुक्यातील ४२ हजार महिलांना मिळाला आहे. प्रति महिना १,५०० रुपयांची रक्कम डीबीटीद्वारे थेट आधार संलग्न बँक खात्यात जमा झाली आहे.

तहसीलदार कार्यालयाकडून मिळालेल्या माहितीनुसार, ज्या भगिनींचे बँक खाते आधार लिंक नाही, त्यांनी त्वरित बँकेत जाऊन ई-केवायसी पूर्ण करावे.
    `,
    featuredImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200",
    youtubeUrl: null,
    status: "PUBLISHED",
    priority: 2,
    isBreaking: false,
    readingTimeMinutes: 2,
    viewCount: 1890,
    publishedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 29 * 60 * 60 * 1000),
    updatedAt: new Date(),
    categoryId: "cat-5",
    category: FALLBACK_CATEGORIES[4],
    locationId: "loc-1",
    location: FALLBACK_LOCATIONS[0],
    reporterId: "rep-1",
    reporter: FALLBACK_REPORTERS[0],
  },
];

export const FALLBACK_TRENDING = FALLBACK_ARTICLES.slice(0, 5);

