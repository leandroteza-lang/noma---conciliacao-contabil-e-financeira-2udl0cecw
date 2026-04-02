export interface Organization {
  id: string
  name: string | null
  cnpj: string | null
  status: boolean | null
  user_id: string | null
}

export interface Account {
  id: string
  organization_id: string
  contaContabil: string
  descricao: string
  banco: string
  agencia: string
  numeroConta: string
  classificacao: string
}
