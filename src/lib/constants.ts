export const EMPRESAS = ['NOMA PARTS', 'LS ALMEIDA', 'NOMA SERVICE', 'PF'] as const

export const EMPRESA_THEME: Record<string, { badge: string; border: string }> = {
  'NOMA PARTS': { badge: 'bg-blue-100 text-blue-800 border-blue-200', border: 'border-blue-500' },
  'LS ALMEIDA': {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    border: 'border-yellow-500',
  },
  'NOMA SERVICE': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    border: 'border-orange-500',
  },
  PF: { badge: 'bg-purple-100 text-purple-800 border-purple-200', border: 'border-purple-500' },
}
