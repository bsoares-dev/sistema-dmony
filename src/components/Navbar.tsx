"use client";

// src/components/Navbar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserInfo {
  id: string;
  nome: string;
  role: "GERENTE" | "OPERADOR";
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [switching, setSwitching] = useState(false);

  // Na montagem: tenta restaurar sessão existente via GET /api/auth/me
  // Se não houver cookie, faz POST com o token padrão do localStorage
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    setSwitching(true);
    try {
      // Primeiro tenta ler sessão já existente (sem alterar cookie)
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        return;
      }
    } catch {
      // Se falhar, cai no fluxo de login com token do localStorage
    }
    // Fallback: seta cookie com token armazenado localmente
    const stored = localStorage.getItem("dmony_role") ?? "operador_token";
    await fetchSetRole(stored);
    setSwitching(false);
  }

  async function fetchSetRole(token: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem("dmony_role", token);
      }
    } catch {
      // ignora
    } finally {
      setSwitching(false);
    }
  }

  function toggleRole() {
    const currentToken = localStorage.getItem("dmony_role") ?? "operador_token";
    const nextToken =
      currentToken === "gerente_token" ? "operador_token" : "gerente_token";
    fetchSetRole(nextToken).then(() => {
      toast.info(
        `Perfil alterado: ${nextToken === "gerente_token" ? "Gerente" : "Operador"}`,
      );
      window.location.reload(); // recarrega para aplicar role no server
    });
  }

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/estoque", label: "Grade de Estoque" },
    { href: "/cadastro", label: "Cadastros" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">D</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                Dmony
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                Moda Íntima · Estoque
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-pink-50 text-pink-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Role switcher mock */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === "GERENTE"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {user.role}
                </span>
                <span className="text-gray-600 hidden md:block">
                  {user.nome}
                </span>
              </div>
            )}
            <button
              onClick={toggleRole}
              disabled={switching}
              title="Alternar perfil (mock)"
              className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300
                         px-2 py-1 rounded transition-colors"
            >
              {switching ? "..." : "Alternar Perfil"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
