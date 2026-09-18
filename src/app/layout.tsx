import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Rozha_One } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const notoSansMarathi = Noto_Sans_Devanagari({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-sans-marathi",
  display: "swap",
});

const rozhaHeadline = Rozha_One({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-marathi-headline",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "आवाज जामखेडचा — जामखेड आणि पंचक्रोशीचा बुलंद आवाज",
    template: "%s | आवाज जामखेडचा",
  },
  description:
    "जामखेड, खर्डा, चोंडी, हळगाव, नानज व अहिल्यानगर परिसरातील ताज्या व विश्वासार्ह बातम्या, शेती बाजारभाव, राजकारण आणि स्थानिक घडामोडी.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "mr_IN",
    url: "https://awaazjamkhed.com",
    siteName: "आवाज जामखेडचा (Awaaz Jamkhedcha)",
    title: "आवाज जामखेडचा — स्थानिक बातम्या आणि डिजिटल वृत्तपत्र",
    description: "जामखेड तालुका आणि अहिल्यानगर जिल्ह्यातील निर्भीड आणि विश्वासार्ह डिजिटल वृत्तपत्र.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@awaazjamkhedcha",
  },
};

export const viewport: Viewport = {
  themeColor: "#991B1B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="mr" className={`${notoSansMarathi.variable} ${rozhaHeadline.variable}`}>
      <head>
        {adsenseClientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col font-marathi bg-[#FAFAFA] text-[#111827] antialiased selection:bg-red-100 selection:text-red-900">
        {children}

        {/* PWA Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Awaaz Jamkhedcha SW registered: ', registration.scope);
                  },
                  function(err) {
                    console.log('Awaaz Jamkhedcha SW registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

