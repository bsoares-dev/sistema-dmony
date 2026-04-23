"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface DashboardMetrics {
  periodo: {
    id: string;
    nome: string;
    status: "ABERTO" | "FECHADO";
    isBootstrap: boolean;
    ordem: number;
  };
  resumoGeral: {
    totalProdutos: number;
    totalRegistros: number;
    totalEI: number;
    totalP: number;
    totalEA: number;
    totalRV: number;
    registrosCompletos: number;
    registrosPendentes: number;
  };
  topProdutos: {
    produtoId: string;
    produtoNome: string;
    totalRV: number;
    totalP: number;
    totalEA: number;
  }[];
  alertasEstoque: {
    id: string;
    produtoNome: string;
    corNome: string;
    tamanhoNome: string;
    ea: number;
    rv: number;
  }[];
  comparativo: {
    periodoAtualNome: string;
    periodoAnteriorNome: string | null;
    rvAtual: number;
    rvAnterior: number | null;
    variacaoPercent: number | null;
  };
}

interface Periodo {
  id: string;
  nome: string;
  status: "ABERTO" | "FECHADO";
  ordem: number;
}

interface DashboardProps {
  userRole: "GERENTE" | "OPERADOR";
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtPercent(n: number | null) {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  sub,
  color = "gray",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "gray" | "blue" | "green" | "pink" | "amber";
}) {
  const colors = {
    gray: "bg-white border-gray-300",
    blue: "bg-blue-50 border-blue-300",
    green: "bg-emerald-50 border-emerald-300",
    pink: "bg-pink-50 border-pink-300",
    amber: "bg-amber-50 border-amber-300",
  };
  return (
    <div className={`${colors[color]} border-2 rounded-xl p-4 shadow-sm`}>
      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-700 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ userRole }: DashboardProps) {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string | null>(
    null,
  );
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [closing, setClosing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const isGerente = userRole === "GERENTE";

  const loadPeriodos = useCallback(async () => {
    try {
      const res = await fetch("/api/periodos");
      const data = await res.json();
      if (data.success) {
        setPeriodos(data.data);
        if (!periodoSelecionado && data.data.length > 0) {
          const aberto = data.data.find((p: Periodo) => p.status === "ABERTO");
          setPeriodoSelecionado(aberto?.id ?? data.data[0].id);
        }
      }
    } catch {
      toast.error("Erro ao carregar períodos");
    }
  }, [periodoSelecionado]);

  useEffect(() => {
    loadPeriodos();
  }, [loadPeriodos]);

  useEffect(() => {
    if (!periodoSelecionado) return;
    setLoadingMetrics(true);
    setMetrics(null);

    fetch(`/api/estoque/periodo/${periodoSelecionado}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMetrics(data.data);
        // Não exibe erro na tela se falhar, apenas deixa as métricas vazias para não sumir com o botão de fechar.
      })
      .catch(() => console.error("Erro ao carregar métricas"))
      .finally(() => setLoadingMetrics(false));
  }, [periodoSelecionado]);

  async function handleEncerrar() {
    if (!periodoSelecionado || !isGerente) return;
    setClosing(true);
    setShowConfirmClose(false);
    const toastId = toast.loading("Encerrando período e calculando RV...");

    try {
      const res = await fetch(`/api/periodos/${periodoSelecionado}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          `Período "${data.data.periodoFechadoNome}" encerrado! Novo período "${data.data.novoPeriodoNome}" criado.`,
          { id: toastId, duration: 7000 },
        );
        await loadPeriodos();
        setPeriodoSelecionado(data.data.novoPeriodoId);
      } else if (res.status === 422) {
        toast.error(
          data.error ??
            "Erro de validação. Certifique-se de preencher algo no estoque.",
          { id: toastId, duration: 8000 },
        );
      } else {
        toast.error(data.error ?? "Erro ao encerrar período", { id: toastId });
      }
    } catch {
      toast.error("Erro de rede. Tente novamente.", { id: toastId });
    } finally {
      setClosing(false);
    }
  }

  async function handleExportarCSV() {
    if (!periodoSelecionado) return;
    setExporting(true);
    const toastId = toast.loading("Gerando CSV...");

    try {
      const res = await fetch(`/api/periodos/${periodoSelecionado}/exportar`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erro ao exportar", { id: toastId });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        `dmony_estoque.csv`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso!", { id: toastId });
    } catch {
      toast.error("Erro ao exportar CSV", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  // A GRANDE CORREÇÃO: Agora ele lê se tá aberto direto da lista de períodos, sem depender das métricas!
  const periodoAtual = periodos.find((p) => p.id === periodoSelecionado);
  const isAberto = periodoAtual?.status === "ABERTO";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          {periodoAtual && (
            <span
              className={`text-sm px-3 py-1 rounded-full font-bold border-2 ${
                isAberto
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              {isAberto ? "● ABERTO" : "🔒 FECHADO"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodoSelecionado ?? ""}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className="text-base font-bold border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white
                       focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id} className="font-bold">
                {p.nome} {p.status === "ABERTO" ? "▶" : "🔒"}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportarCSV}
            disabled={exporting || !periodoSelecionado}
            className="bg-gray-800 text-white hover:bg-gray-900 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? "⏳ Exportando..." : "⬇ Exportar CSV"}
          </button>

          {isGerente && isAberto && (
            <>
              {showConfirmClose ? (
                <div className="flex items-center gap-2 bg-red-100 border-2 border-red-400 rounded-lg px-3 py-1.5 shadow-md">
                  <span className="text-sm text-red-900 font-bold">
                    Tem certeza?
                  </span>
                  <button
                    onClick={handleEncerrar}
                    disabled={closing}
                    className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-md font-bold
                               hover:bg-red-700 disabled:opacity-50"
                  >
                    {closing ? "Calculando..." : "Sim, Encerrar"}
                  </button>
                  <button
                    onClick={() => setShowConfirmClose(false)}
                    className="text-sm text-gray-700 hover:text-gray-900 px-2 font-bold underline"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClose(true)}
                  className="bg-red-600 text-white hover:bg-red-700 font-bold px-5 py-2 rounded-lg shadow-md transition-colors border-2 border-red-700"
                >
                  🔒 Encerrar Período
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {loadingMetrics ? (
        <div className="flex items-center justify-center h-40 text-gray-800 font-bold bg-white rounded-xl border border-gray-200">
          <div className="animate-spin w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full mr-3" />
          Carregando métricas...
        </div>
      ) : !metrics ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-lg font-bold text-gray-900">
            Nenhum dado de estoque registrado ainda.
          </p>
          <p className="text-gray-600 font-medium mt-1">
            Vá até a Grade de Estoque, salve algumas contagens e volte aqui para
            ver os gráficos.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-base font-black text-gray-900 uppercase tracking-wide mb-3">
              Resumo Geral
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Total EI"
                value={fmt(metrics.resumoGeral.totalEI)}
                color="gray"
              />
              <MetricCard
                label="Total P"
                value={fmt(metrics.resumoGeral.totalP)}
                color="blue"
              />
              <MetricCard
                label="Total EA"
                value={fmt(metrics.resumoGeral.totalEA)}
                color="green"
              />
              <MetricCard
                label="Total RV"
                value={fmt(metrics.resumoGeral.totalRV)}
                color="pink"
              />
              <MetricCard
                label="Completos"
                value={fmt(metrics.resumoGeral.registrosCompletos)}
                color="green"
              />
              <MetricCard
                label="Pendentes"
                value={fmt(metrics.resumoGeral.registrosPendentes)}
                color={
                  metrics.resumoGeral.registrosPendentes > 0 ? "amber" : "gray"
                }
              />
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            <section>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wide mb-3">
                Top Produtos por RV
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {metrics.topProdutos.length === 0 ? (
                  <div className="p-6 text-center text-sm font-bold text-gray-500">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-black text-gray-800 uppercase tracking-wide">
                          Produto
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-black text-pink-700 uppercase tracking-wide">
                          RV
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.topProdutos.map((p) => (
                        <tr
                          key={p.produtoId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {p.produtoNome}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-pink-600 text-base">
                            {fmt(p.totalRV)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wide mb-3">
                Alertas de Estoque Baixo (EA ≤ 5)
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {metrics.alertasEstoque.length === 0 ? (
                  <div className="p-6 text-center font-bold text-emerald-700 bg-emerald-50">
                    ✅ Nenhum alerta de estoque baixo
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-80">
                    <table className="min-w-full text-sm">
                      <thead className="bg-amber-100 border-b-2 border-amber-200 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-800 uppercase tracking-wide">
                            Produto
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-black text-gray-800 uppercase tracking-wide">
                            Cor
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-black text-amber-900 uppercase tracking-wide">
                            EA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {metrics.alertasEstoque.map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-amber-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {a.produtoNome}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700">
                              {a.corNome}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-amber-700 text-base">
                              {fmt(a.ea)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
