export type Empresa = 'NOMA PARTS' | 'LS ALMEIDA' | 'NOMA SERVICE' | 'PF'

export interface Account {
  id: string
  empresa: Empresa
  contaContabil: string
  descricao: string
  banco: string
  agencia: string
  numeroConta: string
  classificacao: string
}
