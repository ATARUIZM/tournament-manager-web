import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ToastProvider } from "@/components/Toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/admin/tournaments" className="text-lg font-bold hover:text-gray-300 transition">
              大会管理システム
            </Link>
            <AdminLogoutButton />
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
