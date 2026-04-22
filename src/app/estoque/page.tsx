"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import GradeEstoque from "@/components/GradeEstoque";

export default function EstoquePage() {
  const [periodo, setPeriodo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Procura qual é o período que está ABERTO no banco de dados
    fetch("/api/periodos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const aberto = data.data.find((p: any) => p.status === "ABERTO");
          setPeriodo(aberto || null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Operação Diária</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lance a produção, estoque inicial e entradas avulsas da loja.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Buscando período ativo...
          </div>
        ) : periodo ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {periodo.nome}
              </h2>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
                {periodo.status}
              </span>
            </div>

            {/* Aqui a gente passa exatamente o que a Grade exigiu! */}
            <GradeEstoque
              periodoId={periodo.id}
              periodoStatus={periodo.status}
              isBootstrap={periodo.isBootstrap}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-4xl mb-3">📭</span>
            <h3 className="text-lg font-bold text-gray-900">
              Nenhum período aberto
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              Não há nenhuma contagem de estoque ocorrendo neste momento. Vá até
              o Dashboard para abrir um novo mês/período.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
