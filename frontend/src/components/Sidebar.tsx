"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/authContext";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function Link({
    label,
    href
  }: {
    label: string;
    href: string;
  }) {
    const active = pathname.startsWith(href);

    return (
      <button
        onClick={() => router.push(href)}
        className={`w-full text-left px-4 py-2 rounded ${
          active
            ? "bg-yellow-600 text-white"
            : "text-white-700 hover:bg-gray-900"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <aside className="w-64 min-h-screen border-r border-gray-700 bg-black p-4 flex flex-col text-white">

      <h1 className="text-xl font-bold mb-6">CRM Imobiliária</h1>

      <nav className="flex flex-col gap-2">
        <Link label="Imóveis" href="/imoveis" />

        {user?.role === "ADMIN" && (
          <Link label="Corretores" href="/usuarios" />
        )}
      </nav>

      <div className="mt-auto">
        <button
          onClick={logout}
          className="w-full bg-gray-800 text-white px-4 py-2 rounded"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
