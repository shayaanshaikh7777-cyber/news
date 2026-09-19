const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Awaaz Jamkhedcha database...");

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.clipping.deleteMany({});
  await prisma.liveUpdate.deleteMany({});
  await prisma.articleRevision.deleteMany({});
  await prisma.articleView.deleteMany({});
  await prisma.adClick.deleteMany({});
  await prisma.adImpression.deleteMany({});
  await prisma.advertisement.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.reporterProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.breakingNews.deleteMany({});
  await prisma.whatsAppSubscriber.deleteMany({});
  await prisma.siteSetting.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("Admin@123", salt);
  const editorPassword = await bcrypt.hash("Editor@123", salt);
  const reporterPassword = await bcrypt.hash("Reporter@123", salt);
  const viewerPassword = await bcrypt.hash("Viewer@123", salt);

  // 1. Users
  const superAdmin = await prisma.user.create({
    data: {
      name: "बाळासाहेब देशमुख",
      email: "admin@awaazjamkhed.com",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const editor = await prisma.user.create({
    data: {
      name: "सुनील गायकवाड",
      email: "editor@awaazjamkhed.com",
      passwordHash: editorPassword,
      role: "EDITOR",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const reporterUser1 = await prisma.user.create({
    data: {
      name: "सचिन वारे",
      email: "reporter.jamkhed@awaazjamkhed.com",
      passwordHash: reporterPassword,
      role: "REPORTER",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const reporterUser2 = await prisma.user.create({
    data: {
      name: "गणेश कदम",
      email: "reporter.kharda@awaazjamkhed.com",
      passwordHash: reporterPassword,
      role: "REPORTER",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "प्रमोद जगताप",
      email: "viewer@awaazjamkhed.com",
      passwordHash: viewerPassword,
      role: "VIEWER",
    },
  });

  // 2. Reporter Profiles
  const repProfile1 = await prisma.reporterProfile.create({
    data: {
      userId: reporterUser1.id,
      nameMarathi: "सचिन वारे",
      designation: "वरिष्ठ बातमीदार, जामखेड",
      bio: "गेल्या १० वर्षांपासून जामखेड तालुका आणि ग्रामीण भागातील शेती, राजकारण आणि सामाजिक प्रश्नांवर सातत्याने वार्तांकन.",
      location: "जामखेड, अहिल्यानगर",
      articleCount: 142,
      isVerified: true,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/sachinware_news",
        facebook: "https://facebook.com/sachinware.news",
      }),
    },
  });

  const repProfile2 = await prisma.reporterProfile.create({
    data: {
      userId: reporterUser2.id,
      nameMarathi: "गणेश कदम",
      designation: "विशेष बातमीदार, खर्डा विभाग",
      bio: "ऐतिहासिक खर्डा परिसर, स्थानिक जलसंधारण व ग्रामपंचायत घडामोडींचे तज्ज्ञ विश्लेषक.",
      location: "खर्डा, जामखेड",
      articleCount: 89,
      isVerified: true,
      socialLinks: JSON.stringify({
        facebook: "https://facebook.com/ganeshkadam.kharda",
      }),
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: "Politics", nameMarathi: "राजकारण", slug: "politics", color: "#B91C1C", sortOrder: 1 },
    { name: "Agriculture", nameMarathi: "शेती व बाजारभाव", slug: "agriculture", color: "#15803D", sortOrder: 2 },
    { name: "Local News", nameMarathi: "स्थानिक घडामोडी", slug: "local-news", color: "#C2410C", sortOrder: 3 },
    { name: "Crime", nameMarathi: "गुन्हेगारी", slug: "crime", color: "#4B5563", sortOrder: 4 },
    { name: "Govt Schemes", nameMarathi: "शासन निर्णय व योजना", slug: "govt-schemes", color: "#1D4ED8", sortOrder: 5 },
    { name: "Education", nameMarathi: "शिक्षण व नोकरी", slug: "education", color: "#7C3AED", sortOrder: 6 },
    { name: "Sports", nameMarathi: "क्रीडा", slug: "sports", color: "#0D9488", sortOrder: 7 },
    { name: "Video News", nameMarathi: "व्हिडिओ न्यूज", slug: "video-news", color: "#DC2626", sortOrder: 8 },
  ];

  const catMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    catMap[cat.slug] = created;
  }

  // 4. Locations (Jamkhed Taluka villages in Ahilyanagar district)
  const locationsData = [
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "जामखेड शहर", slug: "jamkhed-city", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "खर्डा", slug: "kharda", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "चोंडी", slug: "chondi", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "नानज", slug: "nanaj", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "हळगाव", slug: "halgaon", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "सावरगाव", slug: "sauergaon", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "जवळके", slug: "javalke", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "राजुरी", slug: "rajuri", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "मोहा", slug: "moha", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "साकत", slug: "sakat", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "जामखेड", village: "दिघोळ", slug: "dighol", isHotspot: false },
    { district: "अहिल्यानगर", taluka: "कर्जत", village: "कर्जत शहर", slug: "karjat-city", isHotspot: true },
    { district: "अहिल्यानगर", taluka: "कर्जत", village: "राशीन", slug: "rashin", isHotspot: true },
  ];

  const locMap = {};
  for (const loc of locationsData) {
    const created = await prisma.location.create({ data: loc });
    locMap[loc.slug] = created;
  }

  // 5. Breaking News
  await prisma.breakingNews.create({
    data: {
      title: "जामखेड कृषी उत्पन्न बाजार समितीत कांद्याला विक्रमी भाव; आवक वाढली, शेतकऱ्यांमध्ये समाधान",
      priority: 3,
      isActive: true,
      linkUrl: "/news/jamkhed-apmc-onion-rates-record-high",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.breakingNews.create({
    data: {
      title: "पुण्यश्लोक अहिल्यादेवी होळकर जन्मस्थळ चोंडी विकास आराखड्यासाठी शासनाकडून १०० कोटींचा निधी मंजूर!",
      priority: 2,
      isActive: true,
      linkUrl: "/news/chondi-ahilyadevi-development-fund-approved",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  // 6. Featured and standard articles
  const articlesData = [
    {
      headline: "जामखेड शहराच्या पाणीपुरवठ्यासाठी नवीन जलवाहिनीचे काम युद्धपातळीवर सुरू; नागरिकांना दिलासा मिळणार",
      subheadline: "खर्डा चौक ते बीड नाका परिसरातील पाईपलाईनचे काम पुढील १५ दिवसांत पूर्ण होणार: मुख्याधिकाऱ्यांची ग्वाही",
      summary: "जामखेड शहरात उन्हाळ्याच्या पार्श्वभूमीवर पाणीटंचाई जाणवू नये म्हणून नगर परिषदेने सुरू केलेल्या नवीन पाणीपुरवठा योजनेचे काम वेगाने सुरू आहे.",
      bodyMarkdown: `### जामखेडकरांसाठी दिलासादायक बातमी

जामखेड शहर आणि लगतच्या उपनगरांमधील पिण्याच्या पाण्याचा प्रश्न कायमस्वरूपी निकाली काढण्यासाठी नगर परिषदेमार्फत सुरू करण्यात आलेल्या नवीन वितरण पाईपलाईनचे काम आता अंतिम टप्प्यात पोहोचले आहे.

मुख्याधिकाऱ्यांनी आज प्रत्यक्ष जागेवर जाऊन पाहणी केली असून कामाचा दर्जा आणि गती याबाबत समाधान व्यक्त केले. 

> "जामखेडकरांना दररोज शुद्ध आणि मुबलक पाणी मिळावे हा आमचा मुख्य उद्देश आहे. येत्या १५ दिवसांत चाचणी घेऊन पाणीपुरवठा सुरळीत केला जाईल."
> — **मुख्याधिकारी, जामखेड नगर परिषद**

#### प्रमुख कामे:
1. **३.५ किलोमीटर नवीन पाईपलाईन**: जुन्या गळती लागलेल्या पाईप्सच्या जागी उच्च दाबाचे एचडीपीई पाईप टाकण्यात आले आहेत.
2. **२ नवीन जलकुंभांची जोडणी**: उंच भागातील वस्त्यांनाही योग्य दाबाने पाणी पोहोचणार.
3. **गळती प्रतिबंधक प्रणाली**: पाण्याचा अपव्यय टाळण्यासाठी आधुनिक व्हॉल्व्ह बसवले जात आहेत.

स्थानिक व्यापारी महासंघाने आणि नागरिकांनी या कामाचे स्वागत केले असून, रस्ता दुरुस्तीही तातडीने हाती घ्यावी अशी मागणी केली आहे.`,
      featuredImage: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1200&auto=format&fit=crop&q=80",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      categoryId: catMap["local-news"].id,
      locationId: locMap["jamkhed-city"].id,
      reporterId: repProfile1.id,
      source: "विशेष प्रतिनिधी, आवाज जामखेडचा",
      priority: 3,
      isBreaking: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
      slug: "jamkhed-water-pipeline-project-update-2026",
      seoTitle: "जामखेड नवीन जलवाहिनी काम युद्धपातळीवर | Awaaz Jamkhedcha",
      seoDescription: "जामखेड शहरातील पाणीपुरवठा सुरळीत करण्यासाठी नगर परिषदेमार्फत नवीन पाईपलाईनचे काम अंतिम टप्प्यात.",
      seoKeywords: "जामखेड पाणीपुरवठा, जामखेड नगर परिषद, जामखेड न्यूज",
      viewCount: 1845,
      uniqueVisitors: 1420,
      readingTimeMinutes: 3,
    },
    {
      headline: "पुण्यश्लोक अहिल्यादेवी होळकर जन्मस्थळ चोंडी विकास आराखड्याला गती; पर्यटन विकासाला नवी दिशा",
      subheadline: "तीर्थक्षेत्र विकास निधीतून आंतरराष्ट्रीय दर्जाचे स्मारक व सुसज्ज अभ्यास केंद्र उभारणार",
      summary: "जामखेड तालुक्यातील चोंडी या पुण्यश्लोक अहिल्यादेवी होळकर यांच्या पावन जन्मभूमीच्या सर्वांगीण विकासासाठी प्रशासनाने विशेष कृती आराखडा जाहीर केला आहे.",
      bodyMarkdown: `### चोंडी तीर्थक्षेत्राचा कायापालट होणार

जामखेड तालुक्यातील ऐतिहासिक चोंडी हे गाव केवळ महाराष्ट्राचेच नव्हे तर संपूर्ण देशाचे प्रेरणास्थान आहे. पुण्यश्लोक अहिल्यादेवी होळकर यांच्या त्रिशताब्दी जयंती वर्षाच्या पार्श्वभूमीवर चोंडी तीर्थक्षेत्राचा आंतरराष्ट्रीय स्तरावर विकास करण्यासाठी शासनाने विशेष निधी मंजूर केला आहे.

या योजनेअंतर्गत भव्य स्मारक, डिजिटल संग्रहालय, सुसज्ज वाचनालय आणि महिला सक्षमीकरण प्रशिक्षण केंद्र उभारण्यात येणार आहे.

#### विकास आराखड्यातील प्रमुख मुद्दे:
- **अहिल्यादेवी जीवनचरित्र डिजिटल संग्रहालय**: अहिल्यादेवींच्या सुशासन, जलव्यवस्थापन आणि मंदिर जीर्णोद्धाराचा इतिहास ऑडिओ-व्हिज्युअल स्वरूपात मांडला जाईल.
- **पर्यटक निवास व भक्तनिवास**: दरवर्षी लाखो भाविक येतात, त्यांच्या सोयीसाठी आधुनिक भक्तनिवास संकुल.
- **सीता नदी घाट सुशोभीकरण**: नदी पात्रात स्वच्छता आणि घाटाचे दगडी बांधकाम.

स्थानिक ग्रामस्थांनी आणि अहिल्याप्रेमींनी शासनाच्या या निर्णयाचे फटाके फोडून स्वागत केले आहे.`,
      featuredImage: "https://images.unsplash.com/photo-1590059390046-512c129e9447?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["politics"].id,
      locationId: locMap["chondi"].id,
      reporterId: repProfile1.id,
      source: "चोंडी वार्ताहर",
      priority: 2,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 3 * 3600 * 1000),
      slug: "chondi-ahilyadevi-development-fund-approved",
      seoTitle: "चोंडी तीर्थक्षेत्र विकास आराखड्याला गती | आवाज जामखेडचा",
      seoDescription: "पुण्यश्लोक अहिल्यादेवी होळकर जन्मस्थळ चोंडी विकासासाठी निधी मंजूर.",
      seoKeywords: "चोंडी, अहिल्यादेवी होळकर, जामखेड, तीर्थक्षेत्र विकास",
      viewCount: 2940,
      uniqueVisitors: 2180,
      readingTimeMinutes: 4,
    },
    {
      headline: "जामखेड बाजार समितीत कांद्याची बंपर आवक; उच्च प्रतीच्या कांद्याला प्रतिक्विंटल २,८०० रुपयांचा दर",
      subheadline: "सोलापूर, उस्मानाबाद आणि बीड जिल्ह्यातील शेतकऱ्यांची जामखेड मार्केटमध्ये गर्दी",
      summary: "जामखेड कृषी उत्पन्न बाजार समितीत आज कांद्याची मोठी आवक झाली असून व्यापाऱ्यांकडून चढा भाव मिळाल्याने शेतकऱ्यांच्या चेहऱ्यावर समाधान दिसून आले.",
      bodyMarkdown: `### शेती व बाजारभाव विशेष वृत्त

जामखेड कृषी उत्पन्न बाजार समितीमध्ये आज आठवडे बाजाराच्या दिवशी कांद्याची विक्रमी आवक नोंदवली गेली. सुमारे २५ हजार गोण्यांची आवक झाली असून उच्च प्रतीच्या लाल कांद्याला प्रतिक्विंटल २,८०० रुपयांपर्यंत कमाल दर मिळाला.

सरासरी भाव २,२०० ते २,५०० रुपयांच्या दरम्यान राहिले, तर हलक्या प्रतीचा कांदा १,४०० ते १,८०० रुपये प्रति क्विंटलने विकला गेला.

| कांदा प्रत | किमान दर (रु/क्विंटल) | कमाल दर (रु/क्विंटल) | सरासरी दर |
|---|---|---|---|
| सुपर एक नंबर (लाल) | २,४०० | २,८०० | २,६०० |
| मध्यम गोलटा | २,००० | २,३५० | २,१८० |
| गोल्टी कांदा | १,५०० | १,८५० | १,६५० |

बाजार समितीचे सभापती यांनी सांगितले की, जामखेड बाजार समितीत वजन काट्यावर पारदर्शकता आणि शेतकऱ्यांना त्वरित रोख पेमेंट मिळत असल्याने परजिल्ह्यातील शेतकरीही माल घेऊन येथे येत आहेत.`,
      featuredImage: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["agriculture"].id,
      locationId: locMap["jamkhed-city"].id,
      reporterId: repProfile2.id,
      source: "कृषी वार्ताहर",
      priority: 2,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000),
      slug: "jamkhed-apmc-onion-rates-record-high",
      seoTitle: "जामखेड बाजार समितीत कांद्याला २८०० चा भाव | Awaaz Jamkhedcha",
      seoDescription: "जामखेड एपीएमसीमध्ये कांद्याची विक्रमी आवक; बाजारभाव व संपूर्ण विश्लेषण.",
      seoKeywords: "जामखेड बाजार समिती, कांदा बाजारभाव, शेती बातम्या",
      viewCount: 3510,
      uniqueVisitors: 2890,
      readingTimeMinutes: 3,
    },
    {
      headline: "ऐतिहासिक खर्डा भुईकोट किल्ल्यावर स्वच्छता मोहीम व शिवकालीन युद्धकलांचे प्रात्यक्षिक संपन्न",
      subheadline: "स्थानिक तरुणांचा उत्स्फूर्त सहभाग; पर्यटन संवर्धनासाठी ग्रामस्थांचा निर्धार",
      summary: "खर्डा येथील प्रसिद्ध भुईकोट किल्ल्याच्या संवर्धनासाठी शिवप्रेमी युवक आणि ग्रामपंचायतीच्या संयुक्त विद्यमाने भव्य स्वच्छता मोहीम राबवण्यात आली.",
      bodyMarkdown: `### ऐतिहासिक वारसा संवर्धन

१७९५ च्या ऐतिहासिक खर्डा लढाईची साक्ष देणाऱ्या खर्डा भुईकोट किल्ल्याच्या परिसरात आज सकाळी शेकडो तरुणांनी एकत्र येत स्वच्छता मोहीम राबवली. 

किल्ल्यातील पायऱ्या, बुरूज आणि खंदक परिसरातील काटेरी झुडपे हटवून परिसर चकाचक करण्यात आला. त्यानंतर शिवकालीन लाठीकाठी आणि दांडपट्टा खेळांची चित्तथरारक प्रात्यक्षिके सादर करण्यात आली.

पुरातत्व विभागाने किल्ल्याच्या जीर्णोद्धारासाठी विशेष लक्ष द्यावे, अशी मागणी यावेळी खर्डा ग्रामस्थांनी केली.`,
      featuredImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["local-news"].id,
      locationId: locMap["kharda"].id,
      reporterId: repProfile2.id,
      source: "खर्डा प्रतिनिधी",
      priority: 1,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 8 * 3600 * 1000),
      slug: "kharda-fort-cleanliness-drive-heritage",
      seoTitle: "खर्डा भुईकोट किल्ल्यावर स्वच्छता मोहीम | आवाज जामखेडचा",
      seoDescription: "ऐतिहासिक खर्डा भुईकोट किल्ला स्वच्छता मोहीम आणि शिवकालीन प्रात्यक्षिके.",
      seoKeywords: "खर्डा किल्ला, जामखेड पर्यटन, ऐतिहासिक वारसा",
      viewCount: 1620,
      uniqueVisitors: 1150,
      readingTimeMinutes: 2,
    },
    {
      headline: "हळगाव कृषी महाविद्यालयात सेंद्रिय शेतीवर विशेष कार्यशाळा; शेतकऱ्यांचा मोठा प्रतिसाद",
      subheadline: "कमी खर्चात जास्त उत्पादन कसे घ्यावे? कृषी शास्त्रज्ञांचे मार्गदर्शन",
      summary: "जामखेड तालुक्यातील हळगाव येथील शासकीय कृषी महाविद्यालयामध्ये परिसरातील शेतकऱ्यांसाठी सेंद्रिय खते व जैविक कीटकनाशक निर्मितीवर प्रात्यक्षिकासह कार्यशाळा पार पडली.",
      bodyMarkdown: `### हळगाव कृषी महाविद्यालय उपक्रम

रासायनिक खतांचा वाढता खर्च आणि जमिनीची घटत चाललेली सुपीकता यावर मात करण्यासाठी हळगाव कृषी महाविद्यालयाने परिसरातील शेतकऱ्यांसाठी एकदिवसीय तंत्रज्ञान कार्यशाळा आयोजित केली होती.

कार्यशाळेत जीवामृत, दशपर्णी अर्क आणि गांडूळ खत निर्मितीचे प्रत्यक्ष प्रात्यक्षिक दाखवण्यात आले. यावेळी शास्त्रज्ञांनी उपस्थित शेतकऱ्यांच्या सर्व शंकांचे निरसन केले.`,
      featuredImage: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["agriculture"].id,
      locationId: locMap["halgaon"].id,
      reporterId: repProfile1.id,
      source: "हळगाव प्रतिनिधी",
      priority: 1,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 14 * 3600 * 1000),
      slug: "halgaon-agriculture-college-organic-farming-workshop",
      seoTitle: "हळगाव कृषी महाविद्यालयात सेंद्रिय शेती कार्यशाळा | Awaaz Jamkhedcha",
      seoDescription: "सेंद्रिय शेती आणि कमी खर्चात शेतीचे शास्त्रोक्त तंत्रज्ञान.",
      seoKeywords: "हळगाव कृषी महाविद्यालय, सेंद्रिय शेती, जामखेड कृषी",
      viewCount: 1190,
      uniqueVisitors: 840,
      readingTimeMinutes: 3,
    },
    {
      headline: "नानाजींच्या माळढोक पक्षी अभयारण्य परिसरात रानगवे आणि दुर्मिळ पक्षांचे दर्शन",
      subheadline: "पर्यावरण प्रेमींमध्ये आनंदाचे वातावरण; वनविभागाने गस्त वाढवली",
      summary: "नानज अभयारण्य परिक्षेत्रात दुर्मीळ पक्ष्यांचे आगमन झाले असून वन्यजीवांचे संरक्षण करण्यासाठी वन विभागामार्फत विशेष मोहीम हाती घेण्यात आली आहे.",
      bodyMarkdown: `### नानज वन्यजीव संवर्धन विशेष

जामखेड-सोलापूर सीमेवरील प्रसिद्ध नानज माळढोक पक्षी अभयारण्य परिसरात या हंगामात स्थलांतरित पक्ष्यांची संख्या वाढली आहे. नुकत्याच झालेल्या पाहणीत माळढोक जोडीसह अनेक दुर्मिळ पक्षांची नोंद झाली आहे.

वनपरिक्षेत्र अधिकाऱ्यांनी नागरिकांना आवाहन केले आहे की, वन्यजीवांना त्रास होणार नाही याची काळजी घ्यावी. शिकारी रोखण्यासाठी ड्रोन कॅमेऱ्यांद्वारे नजर ठेवली जात आहे.`,
      featuredImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["local-news"].id,
      locationId: locMap["nanaj"].id,
      reporterId: repProfile2.id,
      source: "नानज बातमीदार",
      priority: 1,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 20 * 3600 * 1000),
      slug: "nanaj-great-indian-bustard-sanctuary-wildlife-update",
      seoTitle: "नानज अभयारण्यात दुर्मिळ पक्ष्यांचे दर्शन | आवाज जामखेडचा",
      seoDescription: "नानज माळढोक पक्षी अभयारण्य परिसरात स्थलांतरित पक्ष्यांचे आगमन.",
      seoKeywords: "नानज अभयारण्य, माळढोक, जामखेड पर्यावरण",
      viewCount: 2110,
      uniqueVisitors: 1740,
      readingTimeMinutes: 2,
    },
    {
      headline: "जामखेड प्रीमियर लीग (JPL) क्रिकेट स्पर्धेचा अंतिम सामना उद्या; चुरशीची लढत होणार",
      subheadline: "शिव छत्रपती क्रीडांगणावर रंगणार महामुकाबला; विजेत्या संघाला रोख १ लाख व भव्य चषक",
      summary: "जामखेडच्या युवा खेळाडूंसाठी आयोजित बहुचर्चित 'जामखेड प्रीमियर लीग' टेनिस बॉल क्रिकेट स्पर्धेची अंतिम लढत उद्या रंगणार आहे.",
      bodyMarkdown: `### क्रीडा विशेष: जेपीएल २०२६

गेल्या आठवड्यापासून सुरू असलेल्या जामखेड प्रीमियर लीग (JPL) मध्ये १६ संघांनी सहभाग नोंदवला होता. बाद फेरीच्या चुरशीच्या सामन्यांनंतर आता खर्डा वॉरियर्स आणि जामखेड टायटन्स हे दोन मातब्बर संघ अंतिम फेरीत आमनेसामने ठाकणार आहेत.

अंतिम सामन्यासाठी मैदानात आकर्षक प्रकाशझोत आणि डिजिटल स्कोअरबोर्डची व्यवस्था करण्यात आली आहे.`,
      featuredImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["sports"].id,
      locationId: locMap["jamkhed-city"].id,
      reporterId: repProfile1.id,
      source: "क्रीडा प्रतिनिधी",
      priority: 0,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 26 * 3600 * 1000),
      slug: "jamkhed-premier-league-cricket-final-match",
      seoTitle: "जामखेड प्रीमियर लीग क्रिकेट अंतिम सामना | आवाज जामखेडचा",
      seoDescription: "JPL 2026 क्रिकेट स्पर्धेचा अंतिम सामना खर्डा वॉरियर्स विरुद्ध जामखेड टायटन्स.",
      seoKeywords: "JPL 2026, जामखेड क्रिकेट, क्रीडा बातम्या",
      viewCount: 1470,
      uniqueVisitors: 1100,
      readingTimeMinutes: 2,
    },
    {
      headline: "मुख्यमंत्री लाडकी बहीण योजना: जामखेड तालुक्यातील ४२ हजार भगिनींच्या खात्यात सन्मान निधी जमा",
      subheadline: "प्रशासनाकडून पडताळणी पूर्ण; उर्वरित अर्जांवर तत्काळ कार्यवाहीचे निर्देश",
      summary: "महाराष्ट्र शासनाच्या महत्त्वाकांक्षी लाडकी बहीण योजनेचे हफ्ते जामखेड तालुक्यातील पात्र महिलांच्या बँक खात्यात थेट डीबीटीद्वारे जमा झाले आहेत.",
      bodyMarkdown: `### शासन योजना विशेष

जामखेड तहसील कार्यालयाने दिलेल्या माहितीनुसार तालुक्यातील एकूण ४२ हजार ५३० पात्र लाभार्थी महिलांच्या खात्यात योजनेचा थेट लाभ पोहोचला आहे.

ज्या महिलांचे आधार लिंकिंग किंवा बँक त्रुटीमुळे पैसे जमा झाले नाहीत, त्यांच्यासाठी तहसील कार्यालयात आणि सेतू केंद्रांवर विशेष मदत कक्ष सुरू करण्यात आला आहे.`,
      featuredImage: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80",
      categoryId: catMap["govt-schemes"].id,
      locationId: locMap["jamkhed-city"].id,
      reporterId: repProfile1.id,
      source: "शासकीय वार्ताहर",
      priority: 2,
      isBreaking: false,
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 30 * 3600 * 1000),
      slug: "ladki-bahin-yojana-jamkhed-beneficiaries-fund-credited",
      seoTitle: "जामखेड लाडकी बहीण योजना निधी जमा | आवाज जामखेडचा",
      seoDescription: "जामखेड तालुक्यातील महिलांच्या खात्यात लाडकी बहीण योजनेचा निधी वर्ग.",
      seoKeywords: "लाडकी बहीण योजना, जामखेड शासन निर्णय, शासकीय योजना",
      viewCount: 4200,
      uniqueVisitors: 3600,
      readingTimeMinutes: 3,
    },
  ];

  for (const art of articlesData) {
    const createdArt = await prisma.article.create({
      data: {
        ...art,
        createdById: superAdmin.id,
        approvedById: editor.id,
        publishedById: editor.id,
      },
    });

    // Add Live Updates to the lead water pipeline article
    if (art.slug === "jamkhed-water-pipeline-project-update-2026") {
      await prisma.liveUpdate.create({
        data: {
          articleId: createdArt.id,
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          authorName: "सचिन वारे",
          content: "खर्डा चौक परिसरात जुन्या पाईपलाईनचे मुख्य जोडणी काम यशस्वीरीत्या पूर्ण.",
        },
      });
      await prisma.liveUpdate.create({
        data: {
          articleId: createdArt.id,
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          authorName: "सुनील गायकवाड (संपादक)",
          content: "नगर परिषद अभियंता पथक प्रत्यक्ष साईटवर दाखल; जलदाब चाचणी सुरू झाली आहे.",
        },
      });
      await prisma.liveUpdate.create({
        data: {
          articleId: createdArt.id,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          authorName: "सचिन वारे",
          content: "नागरिकांसाठी महत्त्वाची सूचना: उद्या सकाळी ९ ते १२ या वेळेत शहरातील रस्ता वाहतूक पर्यायी मार्गाने वळवण्यात आली आहे.",
        },
      });
    }

    // Add Article Revision
    await prisma.articleRevision.create({
      data: {
        articleId: createdArt.id,
        changedById: editor.id,
        changeSummary: "मजकूर शुद्धलेखन तपासणी व अहवाल मंजुरी",
        diffData: JSON.stringify({ status: "PUBLISHED", verified: true }),
      },
    });
  }

  // 7. Advertisements (Google AdSense fallback + Direct Banner Ads)
  await prisma.advertisement.create({
    data: {
      advertiser: "महालक्ष्मी सराफ आणि ज्वेलर्स, जामखेड",
      bannerUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=970&h=250&auto=format&fit=crop&q=80",
      destinationUrl: "https://example.com/mahalaxmi-jewellers",
      placement: "HEADER",
      weight: 3,
      priority: 1,
      isActive: true,
      impressions: 4890,
      clicks: 142,
      campaignRevenue: 15000.0,
    },
  });

  await prisma.advertisement.create({
    data: {
      advertiser: "कृषीराज ट्रॅक्टर्स व ॲग्रो एजन्सी, जामखेड बायपास",
      bannerUrl: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300&h=600&auto=format&fit=crop&q=80",
      destinationUrl: "https://example.com/krushiraj-tractors",
      placement: "SIDEBAR",
      weight: 2,
      priority: 1,
      isActive: true,
      impressions: 3120,
      clicks: 89,
      campaignRevenue: 8500.0,
    },
  });

  await prisma.advertisement.create({
    data: {
      advertiser: "ज्ञानदीप इंग्लिश मीडियम स्कूल व ज्युनिअर कॉलेज, जामखेड",
      bannerUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=728&h=90&auto=format&fit=crop&q=80",
      destinationUrl: "https://example.com/dnyandeep-school",
      placement: "ARTICLE_MIDDLE",
      weight: 2,
      priority: 1,
      isActive: true,
      impressions: 5410,
      clicks: 198,
      campaignRevenue: 12000.0,
    },
  });

  // 8. WhatsApp Subscribers (Opt-in demo seeds)
  await prisma.whatsAppSubscriber.create({
    data: {
      name: "सागर शिंदे",
      phone: "+919822114455",
      location: "जामखेड शहर",
      preferredCategories: JSON.stringify(["politics", "agriculture", "local-news"]),
      consent: true,
      status: "ACTIVE",
    },
  });

  await prisma.whatsAppSubscriber.create({
    data: {
      name: "विठ्ठल खोसे",
      phone: "+919423667788",
      location: "खर्डा",
      preferredCategories: JSON.stringify(["agriculture", "local-news"]),
      consent: true,
      status: "ACTIVE",
    },
  });

  // 9. Site Settings
  const settings = [
    { key: "site_name", value: "Awaaz Jamkhedcha", description: "पोर्टलचे अधिकृत नाव" },
    { key: "site_tagline", value: "जामखेड आणि पंचक्रोशीचा बुलंद आवाज", description: "अधिकृत ब्रीदवाक्य" },
    { key: "trending_weight_views_24h", value: "0.5", description: "गेल्या २४ तासांतील व्ह्यूजचे वेटेज" },
    { key: "trending_weight_shares", value: "1.5", description: "शेअर्सचे वेटेज" },
    { key: "trending_weight_recency", value: "0.3", description: "ताजेपणाचे वेटेज" },
    { key: "gemini_model", value: "gemini-3.8-flash", description: "AI स्टुडिओसाठी अधिकृत मॉडेल" },
    { key: "adsense_enabled", value: "true", description: "गुगल ॲडसेन्स सक्रिय आहे का" },
    { key: "adsense_client_id", value: "ca-pub-9876543210987654", description: "ॲडसेन्स पब्लिशर आयडी" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.create({ data: s });
  }

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "SYSTEM_INITIALIZED",
      entity: "DATABASE",
      entityId: "system",
      details: JSON.stringify({ message: "Awaaz Jamkhedcha production system seed executed successfully." }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

