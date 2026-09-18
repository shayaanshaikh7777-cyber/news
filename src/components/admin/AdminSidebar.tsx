"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Newspaper,
  Layers,
  MapPin,
  Users,
  Megaphone,
  MessageSquare,
  Bell,
  BarChart3,
  Shield,
  History,
  Settings,
  Smartphone,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { SessionUser } from "@/lib/rbac";

export default function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isEditor = user.role === "EDITOR" || isSuperAdmin;

  const navItems = [
    { label: "डॅशबोर्ड (Dashboard)", href: "/admin", icon: LayoutDashboard },
    { label: "सर्व बातम्या (All News)", href: "/admin/articles", icon: FileText },
    { label: "AI न्यूज स्टुडिओ (AI Studio)", href: "/admin/ai-studio", icon: Sparkles, badge: "Gemini" },
    { label: "मोबाईल रिपोर्टर (Mobile Mode)", href: "/admin/mobile-reporter", icon: Smartphone },
    { label: "ब्रेकिंग न्यूज (Breaking)", href: "/admin/breaking", icon: AlertCircle },
    { label: "वृत्तपत्र कात्रणे (Clippings)", href: "/admin/clippings", icon: Newspaper },
    { label: "मीडिया लायब्ररी (Media)", href: "/admin/media", icon: ImageIcon },
    { label: "विभाग व्यवस्थापन (Categories)", href: "/admin/categories", icon: Layers },
    { label: "गावनिहाय स्थाने (Locations)", href: "/admin/locations", icon: MapPin },
    { label: "बातमीदार प्रोफाइल (Reporters)", href: "/admin/reporters", icon: Users },
    { label: "जाहिरात इंजिन (Ads)", href: "/admin/ads", icon: Megaphone },
    { label: "महसूल डॅशबोर्ड (Revenue)", href: "/admin/revenue", icon: DollarSign },
    { label: "व्हॉट्सॲप सदस्य (WhatsApp)", href: "/admin/whatsapp", icon: MessageSquare },
    { label: "पुश नोटिफिकेशन्स (Push)", href: "/admin/notifications", icon: Bell },
    { label: "वाचक ॲनालिटिक्स (Analytics)", href: "/admin/analytics", icon: BarChart3 },
    ...(isSuperAdmin
      ? [
          { label: "वापरकर्ते व भूमिका (Users & RBAC)", href: "/admin/users", icon: Shield },
          { label: "ऑडिट नोंदी (Audit Logs)", href: "/admin/audit-logs", icon: History },
          { label: "वेबसाइट सेटिंग्ज (Settings)", href: "/admin/settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col flex-shrink-0 min-h-screen border-r border-gray-800">
      {/* Brand Header */}
      <div className="p-4 bg-red-950 border-b border-red-900 flex items-center justify-between">
        <div>
          <Link href="/admin" className="block font-headline font-black text-xl text-white">
            आवाज जामखेडचा
          </Link>
          <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider block mt-0.5">
            डिजिटल न्यूजरूम सीएमएस
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                isActive
                  ? "bg-red-800 text-white shadow-sm"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-yellow-400 text-gray-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Public Site Link */}
      <div className="p-3 border-t border-gray-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-1.5 w-full bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold py-2 rounded-lg transition-colors border border-gray-700"
        >
          <span>पोर्टल पाहा (Public Site) &rarr;</span>
        </Link>
      </div>
    </aside>
  );
}

