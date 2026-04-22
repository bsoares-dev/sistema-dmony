"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  Cor,
  EstoquePorCorResponse,
  ItemGrade,
  ProdutoGrade,
} from "@/types";

interface ItemLocal extends ItemGrade {
  p_local: string;
  ea_local: string;
  ei_local: string;
  dirty: boolean;
}

interface GradeEstoqueProps {
  periodoId: string;
  periodoStatus: "ABERTO" | "FECHADO";
  isBootstrap: boolean;
}

function toItemLocal(item: ItemGrade): ItemLocal {
  return {
    ...item,
    p_local: String(item.p),
    ea_local: String(item.ea),
    ei_local: String(item.ei),
    dirty: false,
  };
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) || n < 0 ? 0 : n;
}

// O TypeScript exigia essa correção (Omit) para não dar conflito
interface TabelaProdutoProps {
  produto: Omit<ProdutoGrade, "items"> & { items: ItemLocal[] };
  isBootstrap: boolean;
  isFechado: boolean;
  onChange: (
    itemId: string,
    field: "p_local" | "ea_local" | "ei_local",
    value: string,
  ) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    itemId: string,
    field: string,
  ) => void;
}

function TabelaProduto({
  produto,
  isBootstrap,
  isFechado,
  onChange,
  onKeyDown,
}: TabelaProdutoProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-sm text-gray-800">
          {produto.produtoNome}
        </h3>
        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
          {produto.grupoGrade}
        </span>
        {produto.items.some((i) => i.dirty) && (
          <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            não salvo
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">
                Tamanho
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                EI
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wide w-28">
                P
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-emerald-600 uppercase tracking-wide w-28">
                EA
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                RV
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produto.items.map((item) => {
              const eiNum = parseNum(item.ei_local);
              const pNum = parseNum(item.p_local);
              const eaNum = parseNum(item.ea_local);
              const rvPreview = eiNum + pNum - eaNum;
              const rvExibido = isFechado ? item.rv : rvPreview;

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${item.dirty ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-3 py-1.5 font-mono text-xs font-semibold text-gray-700">
                    {item.tamanhoNome}
                  </td>
                  <td className="px-3 py-1.5">
                    {isBootstrap ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.ei_local}
                        disabled={isFechado}
                        onChange={(e) =>
                          onChange(item.id, "ei_local", e.target.value)
                        }
                        onKeyDown={(e) => onKeyDown(e, item.id, "ei")}
                        className="grade-input"
                        data-item={item.id}
                        data-field="ei"
                      />
                    ) : (
                      <div className="grade-input bg-gray-50 text-gray-600">
                        {item.ei.toLocaleString("pt-BR")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.p_local}
                      disabled={isFechado}
                      onChange={(e) =>
                        onChange(item.id, "p_local", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, item.id, "p")}
                      className="grade-input border-blue-200"
                      data-item={item.id}
                      data-field="p"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.ea_local}
                      disabled={isFechado}
                      onChange={(e) =>
                        onChange(item.id, "ea_local", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, item.id, "ea")}
                      className="grade-input border-emerald-200"
                      data-item={item.id}
                      data-field="ea"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="grade-input bg-gray-50 text-gray-700">
                      {isFechado ? item.rv : rvExibido}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GradeEstoque({
  periodoId,
  periodoStatus,
  isBootstrap,
}: GradeEstoqueProps) {
  const [cores, setCores] = useState<Cor[]>([]);
  const [corAtiva, setCorAtiva] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<EstoquePorCorResponse | null>(
    null,
  );
  const [localItems, setLocalItems] = useState<Map<string, ItemLocal>>(
    new Map(),
  );
  const [loadingCores, setLoadingCores] = useState(true);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFechado = periodoStatus === "FECHADO";

  useEffect(() => {
    setLoadingCores(true);
    fetch("/api/cores")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCores(data.data);
          if (data.data.length > 0) setCorAtiva(data.data[0].id);
        }
      })
      .catch(() => toast.error("Erro ao carregar cores"))
      .finally(() => setLoadingCores(false));
  }, []);

  useEffect(() => {
    if (!corAtiva) return;
    setLoadingGrade(true);
    setGradeData(null);

    fetch(`/api/estoque/periodo/${periodoId}/cor/${corAtiva}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setGradeData(data.data);
          const map = new Map<string, ItemLocal>();
          for (const produto of data.data.produtos) {
            for (const item of produto.items) {
              map.set(item.id, toItemLocal(item));
            }
          }
          setLocalItems(map);
        } else {
          toast.error(data.error ?? "Erro ao carregar grade");
        }
      })
      .catch(() => toast.error("Erro de rede ao carregar grade"))
      .finally(() => setLoadingGrade(false));
  }, [corAtiva, periodoId]);

  const handleChange = useCallback(
    (
      itemId: string,
      field: "p_local" | "ea_local" | "ei_local",
      value: string,
    ) => {
      setLocalItems((prev) => {
        const map = new Map(prev);
        const item = map.get(itemId);
        if (!item) return prev;
        map.set(itemId, { ...item, [field]: value, dirty: true });
        return map;
      });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      itemId: string,
      field: string,
    ) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const allInputs = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            "[data-item][data-field]",
          ),
        );
        const currentIndex = allInputs.findIndex(
          (el) => el.dataset.item === itemId && el.dataset.field === field,
        );
        const next = allInputs[currentIndex + (e.shiftKey ? -1 : 1)];
        if (next) {
          next.focus();
          next.select();
        }
      }
    },
    [],
  );

  async function handleSalvar() {
    if (!gradeData || isFechado) return;

    const dirtyItems = Array.from(localItems.values()).filter((i) => i.dirty);
    if (dirtyItems.length === 0) return;

    setSaving(true);
    const toastId = toast.loading(
      `Salvando ${dirtyItems.length} registro(s)...`,
    );

    try {
      const payload = {
        items: dirtyItems.map((item) => ({
          id: item.id,
          p: parseNum(item.p_local),
          ea: parseNum(item.ea_local),
          version: item.version,
          ...(isBootstrap ? { ei: parseNum(item.ei_local) } : {}),
        })),
      };

      const res = await fetch(
        `/api/estoque/periodo/${periodoId}/cor/${corAtiva}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setLocalItems((prev) => {
          const map = new Map(prev);
          for (const updated of data.data.items) {
            const existing = map.get(updated.id);
            if (existing) {
              map.set(updated.id, {
                ...existing,
                version: updated.version,
                p: updated.p,
                ea: updated.ea,
                ei: updated.ei ?? existing.ei,
                rv: updated.rv,
                dirty: false,
              });
            }
          }
          return map;
        });
        toast.success(`Contagem salva!`, { id: toastId });
      } else {
        toast.error(data.error ?? "Erro ao salvar", { id: toastId });
      }
    } catch {
      toast.error("Erro de rede. Tente novamente.", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  const totalDirty = Array.from(localItems.values()).filter(
    (i) => i.dirty,
  ).length;

  // Correção tipagem TypeScript (cast as ItemLocal[])
  const produtosComLocais =
    gradeData?.produtos.map((produto) => ({
      ...produto,
      items: produto.items.map(
        (item) => localItems.get(item.id) ?? toItemLocal(item),
      ) as ItemLocal[],
    })) ?? [];

  if (loadingCores)
    return <div className="p-4 text-gray-500">Carregando...</div>;

  return (
    <div className="flex flex-col gap-0">
      <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {cores.map((cor) => (
            <button
              key={cor.id}
              onClick={() => !loadingGrade && setCorAtiva(cor.id)}
              className={`px-3 py-3 text-sm font-medium border-b-2 ${
                corAtiva === cor.id
                  ? "border-pink-500 text-pink-700 bg-pink-50"
                  : "border-transparent text-gray-500"
              }`}
            >
              {cor.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{gradeData?.corNome}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isFechado && (
            <button
              onClick={handleSalvar}
              disabled={saving || loadingGrade || totalDirty === 0}
              className="btn-primary"
            >
              {saving ? "Salvando..." : `Salvar Contagem`}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {loadingGrade ? (
          <div className="p-4 text-gray-500">Carregando grade...</div>
        ) : (
          produtosComLocais.map((produto) => (
            <TabelaProduto
              key={produto.produtoId}
              produto={produto}
              isBootstrap={isBootstrap}
              isFechado={isFechado}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          ))
        )}
      </div>
    </div>
  );
}
