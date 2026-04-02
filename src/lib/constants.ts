import { Account, Empresa } from '@/types'

export const EMPRESAS: Empresa[] = ['NOMA PARTS', 'LS ALMEIDA', 'NOMA SERVICE', 'PF']

export const EMPRESA_THEME: Record<Empresa, { badge: string; border: string; icon: string }> = {
  'NOMA PARTS': {
    badge:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    border: 'border-l-blue-500',
    icon: 'text-blue-500',
  },
  'LS ALMEIDA': {
    badge:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    border: 'border-l-yellow-500',
    icon: 'text-yellow-500',
  },
  'NOMA SERVICE': {
    badge:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    border: 'border-l-orange-500',
    icon: 'text-orange-500',
  },
  PF: {
    badge:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    border: 'border-l-purple-500',
    icon: 'text-purple-500',
  },
}

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    empresa: 'NOMA PARTS',
    contaContabil: '1.1.1.01.0001',
    descricao: 'Caixa Geral Matriz',
    banco: '-',
    agencia: '-',
    numeroConta: '-',
    classificacao: 'Caixa',
  },
  {
    id: '2',
    empresa: 'NOMA PARTS',
    contaContabil: '1.1.1.02.0001',
    descricao: 'Banco Itaú - Movimento',
    banco: 'Itaú',
    agencia: '0001',
    numeroConta: '12345-6',
    classificacao: 'Banco',
  },
  {
    id: '3',
    empresa: 'LS ALMEIDA',
    contaContabil: '1.1.1.02.0002',
    descricao: 'Banco Bradesco - Cobrança',
    banco: 'Bradesco',
    agencia: '0002',
    numeroConta: '98765-4',
    classificacao: 'Banco',
  },
  {
    id: '4',
    empresa: 'NOMA SERVICE',
    contaContabil: '1.1.1.03.0001',
    descricao: 'Aplicação CDB BB',
    banco: 'Banco do Brasil',
    agencia: '0003',
    numeroConta: '55555-5',
    classificacao: 'Investimento',
  },
  {
    id: '5',
    empresa: 'PF',
    contaContabil: '1.1.1.01.0002',
    descricao: 'Fundo Fixo - Diretoria',
    banco: '-',
    agencia: '-',
    numeroConta: '-',
    classificacao: 'Caixa',
  },
]
