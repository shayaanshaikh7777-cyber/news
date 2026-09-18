import React from "react";
import Link from "next/link";
import { MessageSquare, Mail, Phone, MapPin, ShieldCheck, Newspaper } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-950 text-gray-300 pt-12 pb-8 border-t-4 border-red-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-gray-800">
          {/* Col 1: Brand & Identity */}
          <div>
            <Link href="/" className="inline-block">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-headline tracking-tight">
                आवाज जामखेडचा
              </h2>
            </Link>
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider mt-1">
              स्थानिक डिजिटल वृत्तपत्र व न्यूजरूम
            </p>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              जामखेड तालुका, अहिल्यानगर जिल्हा आणि पंचक्रोशीतील शेती, राजकारण, सामाजिक घडामोडी आणि जनसामान्यांच्या प्रश्नांना वाचा फोडणारे निष्पक्ष डिजिटल माध्यम.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>डिजिटल मीडिया आचारसंहितेनुसार प्रमाणित</span>
            </div>
          </div>

          {/* Col 2: News Sections */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 mb-3">
              महत्त्वाचे विभाग
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/category/politics" className="hover:text-white transition-colors">
                  • राजकारण (Politics)
                </Link>
              </li>
              <li>
                <Link href="/category/agriculture" className="hover:text-white transition-colors">
                  • शेती व बाजारभाव (APMC Rates)
                </Link>
              </li>
              <li>
                <Link href="/category/local-news" className="hover:text-white transition-colors">
                  • स्थानिक घडामोडी (Jamkhed Local)
                </Link>
              </li>
              <li>
                <Link href="/category/crime" className="hover:text-white transition-colors">
                  • गुन्हेगारी व पोलीस वार्ता (Crime)
                </Link>
              </li>
              <li>
                <Link href="/category/govt-schemes" className="hover:text-white transition-colors">
                  • शासन निर्णय व योजना (Govt Schemes)
                </Link>
              </li>
              <li>
                <Link href="/category/sports" className="hover:text-white transition-colors">
                  • क्रीडा व युवक (Sports)
                </Link>
              </li>
              <li>
                <Link href="/epaper" className="hover:text-yellow-400 transition-colors font-bold">
                  • दैनिक ई-पेपर व कात्रणे (E-Paper)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Village Taxonomy */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 mb-3">
              गावनिहाय वार्ता (Village News)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/location/jamkhed-city" className="hover:text-white">
                जामखेड शहर
              </Link>
              <Link href="/location/kharda" className="hover:text-white">
                खर्डा
              </Link>
              <Link href="/location/chondi" className="hover:text-white">
                चोंडी
              </Link>
              <Link href="/location/halgaon" className="hover:text-white">
                हळगाव
              </Link>
              <Link href="/location/nanaj" className="hover:text-white">
                नानज
              </Link>
              <Link href="/location/sauergaon" className="hover:text-white">
                सावरगाव
              </Link>
              <Link href="/location/javalke" className="hover:text-white">
                जवळके
              </Link>
              <Link href="/location/rajuri" className="hover:text-white">
                राजुरी
              </Link>
              <Link href="/location/moha" className="hover:text-white">
                मोहा
              </Link>
              <Link href="/location/sakat" className="hover:text-white">
                साकत
              </Link>
            </div>
            <Link
              href="/location/jamkhed-city"
              className="inline-block text-xs text-yellow-400 hover:underline font-bold mt-3"
            >
              सर्व गावे पाहा &rarr;
            </Link>
          </div>

          {/* Col 4: Editorial Desk & WhatsApp */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2 mb-3">
              संपादकीय व संपर्क
            </h3>
            <div className="space-y-2.5 text-xs">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>संपादकीय कार्यालय: खर्डा रोड, बस स्टँडजवळ, जामखेड - ४१३२०१, जि. अहिल्यानगर</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>editor@awaazjamkhed.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>+९१ ९४२३० ००००० (बातम्या व जाहिरात)</span>
              </p>
            </div>

            {/* WhatsApp Opt-in Card */}
            <div className="mt-4 p-3 bg-green-950/60 border border-green-800 rounded-lg">
              <p className="text-xs font-bold text-green-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-green-400" />
                मोफत व्हॉट्सॲप न्यूज अलर्ट
              </p>
              <p className="text-[11px] text-gray-300 mt-1">
                दररोज सकाळी थेट आपल्या व्हॉट्सॲपवर जामखेडच्या महत्त्वाच्या बातम्या मिळवा.
              </p>
              <Link
                href="/subscribe"
                className="mt-2 block text-center bg-[#25D366] hover:bg-[#1EBE5D] text-white py-1.5 px-3 rounded text-xs font-bold transition-colors"
              >
                आताच जॉईन करा
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <p>© {currentYear} आवाज जामखेडचा (Awaaz Jamkhedcha). सर्व हक्क सुरक्षित.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>संपादक: सुनील गायकवाड</span>
            <span>•</span>
            <span>तक्रार निवारण अधिकारी: बाळकृष्ण देशमुख</span>
            <span>•</span>
            <Link href="/admin" className="hover:text-white underline">
              न्यूजरूम लॉगिन
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

