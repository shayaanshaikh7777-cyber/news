"use client";

import React from "react";
import Link from "next/link";
import { Plus, LogOut, Smartphone, User, Sparkles } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { SessionUser } from "@/lib/rbac";

export default function AdminHeader({ user }: { user: SessionUser }) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-800 text-white";
      case "EDITOR":
        return "bg-purple-800 text-white";
      case "REPORTER":
        return "bg-blue-800 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "मुख्य संपादक / सुपर ॲडमीन";
      case "EDITOR":
        return "संपादक";
      case "REPORTER":
        return "बातमीदार";
      default:
        return "वाचक";
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-black text-gray-900 font-headline hidden sm:block">
          न्यूजरूम संपादन कक्ष
        </h2>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getRoleBadge(user.role)}`}>
          {getRoleTitle(user.role)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/mobile-reporter"
          className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-red-800 bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">मोबाईल रिपोर्टर</span>
        </Link>

        <Link
          href="/admin/ai-studio"
          className="flex items-center gap-1 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors border border-purple-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          <span className="hidden sm:inline">AI स्टुडिओ</span>
        </Link>

        <Link
          href="/admin/articles/new"
          className="flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन बातमी</span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-700">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="hidden md:block text-left text-xs">
            <span className="font-bold text-gray-900 block truncate max-w-[120px]">{user.name}</span>
            <span className="text-[10px] text-gray-500 block truncate max-w-[120px]">{user.email}</span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="लॉगआउट"
              className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

