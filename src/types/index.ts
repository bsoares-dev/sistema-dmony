export interface Cor {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface ItemGrade {
  id: string;
  periodoId: string;
  produtoId: string;
  corId: string;
  tamanhoId: string;
  tamanhoNome: string;
  tamanhoOrdem: number;
  ei: number;
  p: number;
  ea: number;
  rv: number;
  version: number;
}

export interface ProdutoGrade {
  produtoId: string;
  produtoNome: string;
  grupoGrade: string;
  items: ItemGrade[];
}

export interface EstoquePorCorResponse {
  periodoId: string;
  corId: string;
  corNome: string;
  periodoNome: string;
  periodoStatus: "ABERTO" | "FECHADO";
  isBootstrap: boolean;
  produtos: ProdutoGrade[];
}

export interface ConflictItem {
  id: string;
  versionCliente: number;
  versionServidor: number;
}
