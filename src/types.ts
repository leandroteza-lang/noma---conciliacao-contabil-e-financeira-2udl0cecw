export interface Organization {
  id: string
  name: string
  [key: string]: any
}

export interface Account {
  id: string
  organization_id: string
  code?: string
  contaContabil?: string
  descricao?: string
  banco?: string
  agencia?: string
  numeroConta?: string
  digitoConta?: string
  tipoConta?: string
  classificacao?: string
  [key: string]: any
}
