"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type CadastroTab = "produtos" | "cores" | "tamanhos";

const GRUPOS_GRADE = ["GRUPO_1", "GRUPO_2", "GRUPO_3", "GRUPO_4"] as const;
const GRUPO_LABELS: Record<string, string> = {
  GRUPO_1: "Grupo 1 — 38 liso/bolha → 54",
  GRUPO_2: "Grupo 2 — 42 → 54 numérico",
  GRUPO_3: "Grupo 3 — P/M/G/GG/XGG",
  GRUPO_4: "Grupo 4 — P/M/G/GG",
};

// ── SYNC BUTTON ───────────────────────────────────────────────

function SincronizarPeriodo() {
  const [syncing, setSyncing] = useState(false);
  const [periodoAbertoId, setPeriodoAbertoId] = useState<string | null>(null);
  const [periodoAbertoNome, setPeriodoAbertoNome] = useState<string>("");

  useEffect(() => {
    fetch("/api/periodos")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const aberto = d.data.find((p: any) => p.status === "ABERTO");
          if (aberto) {
            setPeriodoAbertoId(aberto.id);
            setPeriodoAbertoNome(aberto.nome);
          }
        }
      })
      .catch((err) => console.error("Erro ao buscar períodos", err));
  }, []);

  async function handleSync() {
    if (!periodoAbertoId) return;
    setSyncing(true);
    const toastId = toast.loading("Sincronizando período com o catálogo...");
    try {
      const res = await fetch(
        `/api/estoque/periodo/${periodoAbertoId}/sincronizar`,
        { method: "POST" },
      );
      const d = await res.json();
      if (d.success) {
        if (d.data.criados === 0) {
          toast.info(d.data.message, { id: toastId });
        } else {
          toast.success(d.data.message, { id: toastId });
        }
      } else {
        toast.error(d.error, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao sincronizar", { id: toastId });
    } finally {
      setSyncing(false);
    }
  }

  if (!periodoAbertoId) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-blue-800">
          Sincronizar com período aberto
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Após adicionar novos produtos ou cores, clique aqui para criar os
          registros faltantes em{" "}
          <span className="font-semibold">"{periodoAbertoNome}"</span>.
        </p>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
      >
        {syncing ? "Sincronizando..." : "🔄 Sincronizar Período"}
      </button>
    </div>
  );
}

// ── MODAL CONFIRMAÇÃO ─────────────────────────────────────────

function ConfirmDeleteModal({ nome, onConfirm, onCancel, deleting }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 mb-2">Confirmar exclusão</h3>
        <p className="text-sm text-gray-600 mb-1">
          Deseja desativar/excluir{" "}
          <span className="font-semibold">"{nome}"</span>?
        </p>
        <p className="text-xs text-gray-400 mb-5">
          Itens com histórico de estoque serão desativados (não deletados).
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Excluindo..." : "Confirmar"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────

export default function CadastroPage() {
  const [tab, setTab] = useState<CadastroTab>("produtos");

  const tabs: { id: CadastroTab; label: string; emoji: string }[] = [
    { id: "produtos", label: "Produtos", emoji: "👗" },
    { id: "cores", label: "Cores", emoji: "🎨" },
    { id: "tamanhos", label: "Tamanhos", emoji: "📐" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Cadastros</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o catálogo de produtos, cores e grades de tamanho.
          </p>
        </div>

        <SincronizarPeriodo />

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 my-5 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {tab === "produtos" && <ProdutosCrud />}
        {tab === "cores" && <CoresCrud />}
        {tab === "tamanhos" && <TamanhosCrud />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUTOS
// ─────────────────────────────────────────────────────────────

function ProdutosCrud() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState<string>("GRUPO_1");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      })
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), grupoGrade: grupo }),
      });

      const d = await res.json();
      if (res.ok && d.success) {
        setItems((prev) =>
          [...prev, d.data].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setNome("");
        toast.success("Produto criado!");
      } else {
        toast.error(d.error || "Erro desconhecido retornado pela API");
      }
    } catch (err: any) {
      toast.error("Falha de conexão com a API de Produtos.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d.success) {
        // Atualiza a tela filtrando o item apagado
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(d.message || "Produto inativado!");
      } else {
        toast.error(d.error || "Erro ao excluir produto");
      }
    } catch (err) {
      toast.error("Falha ao excluir produto.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Novo Produto</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            {GRUPOS_GRADE.map((g) => (
              <option key={g} value={g}>
                {GRUPO_LABELS[g]}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">
            {items.filter((i) => i.ativo !== false).length} ativo(s)
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Carregando...
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items
              .filter((i) => i.ativo !== false)
              .map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between text-gray-900"
                >
                  <div>
                    {item.nome} -{" "}
                    <span className="text-xs bg-gray-200 px-2 rounded">
                      {item.grupoGrade}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmDelete({ id: item.id, nome: item.nome })
                    }
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                    title="Inativar Produto"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal
          nome={confirmDelete.nome}
          deleting={deletingId === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CORES
// ─────────────────────────────────────────────────────────────

function CoresCrud() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cores")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), ordem: items.length + 1 }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setItems((prev) => [...prev, d.data]);
        setNome("");
        toast.success("Cor adicionada!");
      } else toast.error("Erro na API: " + d.error);
    } catch (err) {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cores/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(d.message || "Cor inativada!");
      } else {
        toast.error(d.error || "Erro ao excluir cor");
      }
    } catch (err) {
      toast.error("Falha ao excluir cor.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Nova Cor</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ex: Coral, Lilás..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">
            {items.filter((i) => i.ativo !== false).length} ativa(s)
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Carregando...
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items
              .filter((i) => i.ativo !== false)
              .map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between text-gray-900"
                >
                  <span className="font-medium">{item.nome}</span>
                  <button
                    onClick={() =>
                      setConfirmDelete({ id: item.id, nome: item.nome })
                    }
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                    title="Inativar Cor"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal
          nome={confirmDelete.nome}
          deleting={deletingId === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAMANHOS
// ─────────────────────────────────────────────────────────────

function TamanhosCrud() {
  const [items, setItems] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState<string>("GRUPO_3");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tamanhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), grupo, ordem: 99 }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setItems((prev) => [...prev, d.data]);
        setNome("");
      } else toast.error("Erro na API: " + d.error);
    } catch (err) {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Novo Tamanho</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Ex: 56, XXXG..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
          >
            {GRUPOS_GRADE.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
