"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar"; // <-- Trazendo a Navbar de volta!

interface ProdutoFinanceiro {
  id: string;
  nome: string;
  grupoGrade: string;
  custo: number | string;
  precoVarejo: number | string;
  precoAtacado: number | string;
}

export default function PaginaCustos() {
  const [produtos, setProdutos] = useState<ProdutoFinanceiro[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  // Estados para o Modal de Novo Produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    grupoGrade: "GRUPO_1",
    custo: "",
    precoVarejo: "",
    precoAtacado: "",
  });
  const [criando, setCriando] = useState(false);

  // Carrega os produtos
  function carregarProdutos() {
    fetch("/api/produtos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const produtosFormatados = data.data.map((p: any) => ({
            ...p,
            custo: Number(p.custo) || "",
            precoVarejo: Number(p.precoVarejo) || "",
            precoAtacado: Number(p.precoAtacado) || "",
          }));
          setProdutos(produtosFormatados);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  // Função para salvar edições na linha
  async function salvarPrecos(p: ProdutoFinanceiro) {
    setSalvandoId(p.id);
    try {
      const res = await fetch(`/api/produtos/${p.id}/financeiro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custo: Number(p.custo) || 0,
          precoVarejo: Number(p.precoVarejo) || 0,
          precoAtacado: Number(p.precoAtacado) || 0,
        }),
      });

      if (res.ok) {
        toast.success(`Preços do ${p.nome} atualizados!`);
      } else {
        toast.error("Erro ao salvar no banco.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSalvandoId(null);
    }
  }

  // Função para criar um NOVO produto
  async function cadastrarNovoProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!novoProduto.nome) {
      toast.error("O nome do produto é obrigatório!");
      return;
    }

    setCriando(true);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoProduto),
      });

      if (res.ok) {
        toast.success("Produto cadastrado com sucesso!");
        setIsModalOpen(false); // Fecha o modal
        setNovoProduto({
          nome: "",
          grupoGrade: "GRUPO_1",
          custo: "",
          precoVarejo: "",
          precoAtacado: "",
        }); // Limpa o form
        carregarProdutos(); // Atualiza a lista na tela
      } else {
        toast.error("Erro ao cadastrar. O nome já existe?");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setCriando(false);
    }
  }

  function handleChange(
    id: string,
    campo: keyof ProdutoFinanceiro,
    valor: string,
  ) {
    setProdutos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)),
    );
  }

  if (loading)
    return (
      <div className="p-8 text-gray-900 font-medium bg-gray-50 min-h-screen">
        Carregando catálogo financeiro...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Nossa Navbar de volta! */}
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {/* Cabeçalho com Botão de Novo Produto */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Gestão de Custos e Preços
            </h1>
            <p className="text-gray-600 text-sm">
              Atualize valores rapidamente ou cadastre novos produtos.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>+</span> Cadastrar Produto
          </button>
        </div>

        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Digite o nome do produto para buscar..."
              className="w-full pl-10 p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Edição Rápida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                    Custo (R$)
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                    Varejo (R$)
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                    Atacado (R$)
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {produtosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {p.nome}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {p.grupoGrade}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 p-2 text-center text-gray-900 bg-white border rounded-lg border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                        value={p.custo}
                        onChange={(e) =>
                          handleChange(p.id, "custo", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 p-2 text-center text-gray-900 bg-white border rounded-lg border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                        value={p.precoVarejo}
                        onChange={(e) =>
                          handleChange(p.id, "precoVarejo", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 p-2 text-center text-gray-900 bg-white border rounded-lg border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                        value={p.precoAtacado}
                        onChange={(e) =>
                          handleChange(p.id, "precoAtacado", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => salvarPrecos(p)}
                        disabled={salvandoId === p.id}
                        className="px-5 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                      >
                        {salvandoId === p.id ? "..." : "Salvar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {produtosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 bg-white"
                    >
                      Nenhum produto encontrado com esse nome.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO DE PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Novo Produto</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={cadastrarNovoProduto} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 bg-white"
                    placeholder="Ex: Sutiã Renda"
                    value={novoProduto.nome}
                    onChange={(e) =>
                      setNovoProduto({ ...novoProduto, nome: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Grupo de Grade
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 bg-white"
                    value={novoProduto.grupoGrade}
                    onChange={(e) =>
                      setNovoProduto({
                        ...novoProduto,
                        grupoGrade: e.target.value,
                      })
                    }
                  >
                    <option value="GRUPO_1">GRUPO_1</option>
                    <option value="GRUPO_2">GRUPO_2</option>
                    <option value="GRUPO_3">GRUPO_3</option>
                    <option value="GRUPO_4">GRUPO_4</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      value={novoProduto.custo}
                      onChange={(e) =>
                        setNovoProduto({
                          ...novoProduto,
                          custo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Varejo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      value={novoProduto.precoVarejo}
                      onChange={(e) =>
                        setNovoProduto({
                          ...novoProduto,
                          precoVarejo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Atacado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      value={novoProduto.precoAtacado}
                      onChange={(e) =>
                        setNovoProduto({
                          ...novoProduto,
                          precoAtacado: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {criando ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
