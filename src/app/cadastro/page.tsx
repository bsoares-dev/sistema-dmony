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
      });
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
    } catch {
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

function ConfirmDeleteModal({
  nome,
  onConfirm,
  onCancel,
  deleting,
}: {
  nome: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editGrupo, setEditGrupo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    nome: string;
  } | null>(null);
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
      if (d.success) {
        setItems((prev) =>
          [...prev, d.data].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setNome("");
        toast.success("Produto criado!");
      } else {
        toast.error(d.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editNome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNome.trim(), grupoGrade: editGrupo }),
      });
      const d = await res.json();
      if (d.success) {
        setItems((prev) =>
          prev
            .map((p) => (p.id === id ? d.data : p))
            .sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setEditingId(null);
        toast.success("Produto atualizado!");
      } else {
        toast.error(d.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        setItems((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ativo: false } : p)),
        );
        toast.success(d.message);
      } else {
        toast.error(d.error);
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  async function handleReativar(id: string) {
    const res = await fetch(`/api/produtos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: true }),
    });
    const d = await res.json();
    if (d.success) {
      setItems((prev) => prev.map((p) => (p.id === id ? d.data : p)));
      toast.success("Produto reativado!");
    }
  }

  return (
    <div className="space-y-5">
      {confirmDelete && (
        <ConfirmDeleteModal
          nome={confirmDelete.nome}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          deleting={!!deletingId}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Novo Produto</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Nome do produto"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
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
            className="btn-primary"
          >
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">
            {items.filter((i) => i.ativo).length} ativo(s) ·{" "}
            {items.filter((i) => !i.ativo).length} inativo(s)
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Carregando...
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-5 py-3 flex items-center gap-3 ${!item.ativo ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}`}
              >
                {editingId === item.id ? (
                  <>
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleEdit(item.id)
                      }
                      className="flex-1 border border-pink-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      autoFocus
                    />
                    <select
                      value={editGrupo}
                      onChange={(e) => setEditGrupo(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {GRUPOS_GRADE.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEdit(item.id)}
                      disabled={saving}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm ${!item.ativo ? "line-through text-gray-400" : "text-gray-800"}`}
                    >
                      {item.nome}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                      {item.grupoGrade}
                    </span>
                    {item.ativo ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditNome(item.nome);
                            setEditGrupo(item.grupoGrade);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({ id: item.id, nome: item.nome })
                          }
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReativar(item.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50"
                      >
                        Reativar
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    nome: string;
  } | null>(null);
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
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), ordem: items.length + 1 }),
      });
      const d = await res.json();
      if (d.success) {
        setItems((prev) => [...prev, d.data]);
        setNome("");
        toast.success("Cor criada!");
      } else {
        toast.error(d.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editNome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/cores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNome.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setItems((prev) => prev.map((c) => (c.id === id ? d.data : c)));
        setEditingId(null);
        toast.success("Cor atualizada!");
      } else {
        toast.error(d.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cores/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        setItems((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ativo: false } : c)),
        );
        toast.success(d.message);
      } else {
        toast.error(d.error);
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      {confirmDelete && (
        <ConfirmDeleteModal
          nome={confirmDelete.nome}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          deleting={!!deletingId}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Nova Cor</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ex: Coral, Lilás..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">
            {items.filter((i) => i.ativo).length} cor(es) ativa(s)
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Carregando...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className={`px-5 py-3 flex items-center gap-3 ${!item.ativo ? "opacity-50" : "hover:bg-gray-50"}`}
              >
                <span className="w-3 h-3 rounded-full bg-pink-300 flex-shrink-0" />
                {editingId === item.id ? (
                  <>
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleEdit(item.id)
                      }
                      className="flex-1 border border-pink-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                      autoFocus
                    />
                    <button
                      onClick={() => handleEdit(item.id)}
                      disabled={saving}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 px-2"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm ${!item.ativo ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {item.nome}
                    </span>
                    <span className="text-xs text-gray-400">#{item.ordem}</span>
                    {item.ativo && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditNome(item.nome);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({ id: item.id, nome: item.nome })
                          }
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAMANHOS
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// TAMANHOS
// ─────────────────────────────────────────────────────────────

function TamanhosCrud() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState<string>("GRUPO_3");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tamanhos")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tamanhos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), grupo, ordem: 99 }),
      });
      const d = await res.json();
      if (d.success) {
        setItems((prev) => [...prev, d.data]);
        setNome("");
        toast.success("Tamanho criado!");
      } else {
        toast.error(d.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tamanhos/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        setItems((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ativo: false } : t)),
        );
        toast.success(d.message);
      } else {
        toast.error(d.error);
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  const porGrupo = items.reduce(
    (acc, t) => {
      if (!acc[t.grupo]) acc[t.grupo] = [];
      acc[t.grupo].push(t);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return (
    <div className="space-y-5">
      {confirmDelete && (
        <ConfirmDeleteModal
          nome={confirmDelete.nome}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          deleting={!!deletingId}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Novo Tamanho</h2>
        <p className="text-xs text-amber-600 mb-4">
          ⚠️ O grupo de um tamanho não pode ser alterado após criação.
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Ex: 56, XXXG..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            {GRUPOS_GRADE.map((g) => (
              <option key={g} value={g}>
                {g} — {GRUPO_LABELS[g]}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Carregando...
          </div>
        ) : (
          Object.entries(porGrupo).map(([grp, tamanhos]) => (
            <div
              key={grp}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {grp}
                </span>
                <span className="text-xs text-gray-400">
                  — {GRUPO_LABELS[grp]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {(tamanhos as any[])
                  .sort((a: any, b: any) => a.ordem - b.ordem)
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-medium group ${t.ativo ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-400 line-through"}`}
                    >
                      {t.nome}
                      {t.ativo && (
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              id: t.id,
                              nome: `${t.nome} (${grp})`,
                            })
                          }
                          className="hidden group-hover:inline text-red-400 hover:text-red-600 text-xs ml-1 leading-none"
                          title="Excluir"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
