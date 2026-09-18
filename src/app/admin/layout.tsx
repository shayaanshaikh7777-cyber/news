import React from "react";
import { getCurrentUser } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-invoke-path") || "";

  // Allow login page to render without sidebar
  const user = await getCurrentUser();

  // If visiting login, pass through
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-marathi antialiased">
      {user ? (
        <>
          <AdminSidebar user={user} />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader user={user} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}
