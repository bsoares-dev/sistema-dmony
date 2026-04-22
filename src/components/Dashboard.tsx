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
    gray: "bg-white border-gray-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-emerald-50 border-emerald-200",
    pink: "bg-pink-50 border-pink-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`${colors[color]} border rounded-xl p-4`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
  }, []);

  useEffect(() => {
    if (!periodoSelecionado) return;
    setLoadingMetrics(true);
    setMetrics(null);

    fetch(`/api/estoque/periodo/${periodoSelecionado}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMetrics(data.data);
        else toast.error(data.error ?? "Erro ao carregar métricas");
      })
      .catch(() => toast.error("Erro de rede"))
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
        toast.error(data.error ?? "Erro de validação", {
          id: toastId,
          duration: 8000,
        });
      } else if (res.status === 403) {
        toast.error("Acesso negado. Apenas Gerentes podem encerrar períodos.", {
          id: toastId,
        });
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

  const periodoAtual = metrics?.periodo;
  const isAberto = periodoAtual?.status === "ABERTO";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          {periodoAtual && (
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                isAberto
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isAberto ? "● ABERTO" : "🔒 FECHADO"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodoSelecionado ?? ""}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white
                       focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} {p.status === "ABERTO" ? "▶" : "🔒"}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportarCSV}
            disabled={exporting || !periodoSelecionado}
            className="btn-secondary"
          >
            {exporting ? "⏳ Exportando..." : "⬇ Exportar CSV"}
          </button>

          {isGerente && isAberto && (
            <>
              {showConfirmClose ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
                  <span className="text-sm text-red-700 font-medium">
                    Confirmar?
                  </span>
                  <button
                    onClick={handleEncerrar}
                    disabled={closing}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md font-semibold
                               hover:bg-red-700 disabled:opacity-50"
                  >
                    {closing ? "Encerrando..." : "Sim, Encerrar"}
                  </button>
                  <button
                    onClick={() => setShowConfirmClose(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClose(true)}
                  className="btn-danger"
                >
                  🔒 Encerrar Período e Calcular RV
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {loadingMetrics && (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full mr-3" />
          Carregando métricas...
        </div>
      )}

      {metrics && !loadingMetrics && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resumo Geral
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Top Produtos por RV
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {metrics.topProdutos.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                          Produto
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-pink-500">
                          RV
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {metrics.topProdutos.map((p) => (
                        <tr key={p.produtoId} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {p.produtoNome}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-pink-600 font-mono">
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
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Alertas de Estoque Baixo (EA ≤ 5)
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {metrics.alertasEstoque.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    ✅ Nenhum alerta de estoque baixo
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-80">
                    <table className="min-w-full text-sm">
                      <thead className="bg-amber-50 border-b border-amber-100 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                            Produto
                          </th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">
                            Cor
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-amber-600">
                            EA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {metrics.alertasEstoque.map((a) => (
                          <tr key={a.id} className="hover:bg-amber-50">
                            <td className="px-4 py-2 text-gray-800 text-xs">
                              {a.produtoNome}
                            </td>
                            <td className="px-4 py-2 text-gray-500 text-xs">
                              {a.corNome}
                            </td>
                            <td className="px-4 py-2 text-right font-bold font-mono text-amber-700">
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
