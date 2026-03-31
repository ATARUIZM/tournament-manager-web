"use client";

export function AdminLogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-300 hover:text-white transition"
    >
      ログアウト
    </button>
  );
}
