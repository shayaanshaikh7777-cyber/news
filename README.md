# आवाज जामखेडचा (Awaaz Jamkhedcha)
> **Production-Grade Hyper-Local News Web Platform & Digital Newsroom CMS**
> **स्थानिक बातमी पोर्टल आणि डिजिटल न्यूजरूम व्यवस्थापन प्रणाली**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passed-green?style=flat)](./tests)

---

## 📌 प्रकल्प परिचय (Project Overview)

**"आवाज जामखेडचा" (Awaaz Jamkhedcha)** हे जामखेड शहर, पंचक्रोशीतील गावे (खर्डा, चोंडी, हळगाव, नानज, साकत, दिघोळ इत्यादी), कर्जत-जामखेड विधानसभा मतदारसंघ आणि अहिल्यानगर (अहमदनगर) जिल्ह्यासाठी तयार केलेले संपूर्ण, आधुनिक आणि हाय-परफॉर्मन्स डिजिटल वृत्तपत्र व न्यूजरूम CMS प्लॅटफॉर्म आहे.

---

## 🌟 प्रमुख वैशिष्ट्ये (Key Features)

- 📰 **सार्वजनिक वृत्त पोर्टल (Public News Portal)**:
  - संपादकीय मांडणी: मुख्य बातमी (Lead Story), ट्रेंडिंग बातम्या, व्हिडिओ डेस्क, ब्रेकिंग टिकर.
  - **"माझ्या गावातील बातम्या"** (Hyper-Local Village News Hub): खर्डा, चोंडी, हळगाव, नानज, इ. गावांनुसार बातम्या.
  - बातमी वाचन पृष्ठ: सारांश (Key Takeaways), थेट लाईव्ह अपडेट्स टाइमलाइन, सुरक्षित YouTube व्हिडिओ प्लेयर, व व्हॉट्सॲप शेअर.
  - अचूक ट्रेंडिंग अल्गोरिदम (वाचक संख्या + वाचनाचा वेळ + ताजेपणा).

- 🖋️ **११-टप्प्यांची खरीखुरी संपादकीय कार्यप्रणाली (11-Step Editorial Workflow)**:
  - `DRAFT` &rarr; `SUBMITTED` &rarr; `UNDER_REVIEW` &rarr; `APPROVED` &rarr; `SCHEDULED` &rarr; `PUBLISHED` &rarr; `NEEDS_UPDATE` &rarr; `RETRACTED` &rarr; `ARCHIVED` &rarr; `REJECTED` &rarr; `REVISION_REQUESTED`.
  - प्रत्येक बदलाचा रिव्हिजन इतिहास (Diff Viewer) आणि अपरिवर्तनीय ऑडिट लॉग्स (IP आणि User-Agent सह).

- 🤖 **गुगल जेमिनी AI न्यूजरूम स्टुडिओ (Google Gemini API - 14 Actions)**:
  - अधिकृत `@google/genai` SDK द्वारे संचालित (`gemini-3.8-flash`).
  - Zod रचनाबद्ध व्हॅलिडेशनसह १४ पत्रकारिता कृती:
    1. शीर्षक पर्याय (5 Catchy Headlines)
    2. बातमीचा सारांश (3-Bullet Summary)
    3. मसुदा सुधारणा व व्याकरण (Fact-Check & Polish)
    4. स्थानिक संदर्भ जोडणी (Jamkhed Context)
    5. सोशल मीडिया पोस्ट्स (Facebook, X, WhatsApp)
    6. SEO मेटा माहिती (Title, Description, Keywords)
    7. पत्रकारिता प्रश्न (Follow-up Questions)
    8. व्हॉट्सॲप अलर्ट (WhatsApp Broadcast Alert)
    9. संवेदनशीलता तपासणी (Content Sensitivity Check)
    10. ऑडिओ बुलेटिन स्क्रिप्ट (Radio Script)
    11. ई-पेपर मथळा (Print E-Paper Cut)
    12. स्थानिक जनमत अंदाज (Public Sentiment Analysis)
    13. संबंधित बातम्या संदर्भ (Related Context Generator)
    14. मराठी भाषांतर (English/Hindi to Authentic Marathi)

- 🖼️ **मल्टी-फॉर्मॅट वृत्तपत्र कात्रण जनरेटर (Clipping Generator)**:
  - Sharp व SVG द्वारे त्वरित हाय-रिझोल्युशन PNG आणि WebP डाऊनलोड:
    - **Instagram Story / WhatsApp Status** (1080 &times; 1920)
    - **Instagram Portrait 4:5** (1080 &times; 1350)
    - **Instagram Square** (1080 &times; 1080)
    - **E-Paper Cut** (1200 &times; 1600)

- 🎙️ **मोबाईल रिपोर्टर मोड (Mobile Field Reporter)**:
  - Web Speech API द्वारे थेट मराठी व्हॉइस डिक्टेशन (Voice-to-Text) आणि बातमी थेट ड्राफ्ट म्हणून पाठवण्याची सोय.

- 💰 **जाहिरात व महसूल इंजिन (Ad Engine & Monetization)**:
  - थेट स्थानिक जाहिरातदार बॅनर मोहिमा (वेटेज रोटेशन व क्लिक/इम्प्रेशन ट्रॅकिंग).
  - Google AdSense स्लॉट्स.

- 🔍 **SEO & PWA**:
  - Google News-मानक डायनॅमिक `news-sitemap.xml`, `sitemap.xml` आणि Schema.org `NewsArticle` JSON-LD.
  - Progressive Web App (`manifest.json` व `sw.js`).

---

## 🛠️ तंत्रज्ञान (Tech Stack)

| स्तर | तंत्रज्ञान |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React, Devanagari Fonts |
| **Backend** | Next.js Server Actions, Route Handlers, Node.js v24 |
| **Database** | Prisma ORM (SQLite for zero-config dev / PostgreSQL-ready) |
| **Authentication** | Custom JWT Session Auth (HTTP-only cookies), bcryptjs, 4-tier RBAC |
| **AI Integration** | Google Gemini API (`@google/genai` SDK, `gemini-3.8-flash`) |
| **Image Processing**| Sharp (SVG to PNG/WebP rasterization) |
| **Testing** | Vitest (Unit & Integration tests) |

---

## 🚀 सुरू कसे करावे (Quick Start)

### १. कोड क्लोन करा
```bash
git clone https://github.com/shayaanshaikh7777-cyber/news.git
cd news
```

### २. डिपेंडेंसी इन्स्टॉल करा
```bash
npm install
```

### ३. पर्यावरण व्हेरिएबल्स (.env) तयार करा
`.env.example` वरून `.env` फाइल तयार करा:
```bash
cp .env.example .env
```
*(टीप: जेमिनी API की नसतानाही सर्व AI कार्यप्रणाली आपोआप फॉलबॅक मोडमध्ये व्यवस्थित काम करते)*

### ४. डेटाबेस तयार करून डेटा भरा (Seed Database)
```bash
npx prisma db push
npm run db:seed
```

### ५. डेव्हलपमेंट सर्व्हर सुरू करा
```bash
npm run dev
```
पोर्टल [http://localhost:3000](http://localhost:3000) वर सुरू होईल.

---

## 🔑 डीफॉल्ट न्यूजरूम लॉगिन खाती (Default Accounts)

डेटाबेस सीडिंगनंतर खालील खाती उपलब्ध आहेत:

| पद (Role) | ईमेल | पासवर्ड | अधिकार |
| :--- | :--- | :--- | :--- |
| **मुख्य संपादक** (`SUPER_ADMIN`) | `admin@awaazjamkhed.com` | `Admin@Jamkhed2026` | सर्व नियंत्रण, वापरकर्ते, जाहिरात व महसूल |
| **संपादक** (`EDITOR`) | `editor@awaazjamkhed.com` | `Editor@Jamkhed2026` | बातम्या मंजुरी, प्रकाशन, ब्रेकिंग, लाईव्ह |
| **वार्ताहर** (`REPORTER`) | `reporter@awaazjamkhed.com` | `Reporter@Jamkhed2026` | बातमी लेखन, AI स्टुडिओ, व्हॉइस रिपोर्टर |
| **वाचक** (`VIEWER`) | `viewer@awaazjamkhed.com` | `Viewer@Jamkhed2026` | सामान्य वाचक |

---

## 🧪 स्वयंचलित चाचण्या (Automated Tests)

सर्व ३० युनिट व इंटिग्रेशन चाचण्या चालवण्यासाठी:
```bash
npm test
```

प्रॉडक्शन बिल्ड तपासण्यासाठी:
```bash
npm run build
```

---

## 📄 परवाना (License)

हा प्रकल्प MIT परवान्याअंतर्गत उपलब्ध आहे.
© २०२६ आवाज जामखेडचा (Awaaz Jamkhedcha). सर्व हक्क राखीव.

