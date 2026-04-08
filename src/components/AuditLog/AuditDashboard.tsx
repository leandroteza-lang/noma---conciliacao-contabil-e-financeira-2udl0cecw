import React from 'react'
import { Shield, PlusCircle, Edit3, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditDashboardProps {
  logs: any[]
  entityType: string
  activeFilter?: string | null
  onFilterChange?: (filter: string | null) => void
}

export function AuditDashboard({ logs, activeFilter, onFilterChange }: AuditDashboardProps) {
  const stats = {
    total: logs.length,
    create: logs.filter((l) => ['CREATE', 'INCLUSÃO'].includes(l.action)).length,
    update: logs.filter((l) => ['UPDATE', 'EDIÇÃO'].includes(l.action)).length,
    delete: logs.filter((l) => ['DELETE', 'EXCLUSÃO', 'SOFT_DELETE'].includes(l.action)).length,
  }

  const cards = [
    {
      id: 'TOTAL',
      label: 'Total de Registros',
      value: stats.total,
      icon: Shield,
      gradient: 'from-[#003d82] to-[#0099ff]',
      ringColor: 'ring-[#0099ff]',
    },
    {
      id: 'CREATE',
      label: 'Inclusões',
      value: stats.create,
      icon: PlusCircle,
      gradient: 'from-[#0d5d5d] to-[#1dd1a1]',
      ringColor: 'ring-[#1dd1a1]',
    },
    {
      id: 'UPDATE',
      label: 'Edições',
      value: stats.update,
      icon: Edit3,
      gradient: 'from-[#8b4513] to-[#ff8c00]',
      ringColor: 'ring-[#ff8c00]',
    },
    {
      id: 'DELETE',
      label: 'Exclusões',
      value: stats.delete,
      icon: Trash2,
      gradient: 'from-[#6c0572] to-[#ff006e]',
      ringColor: 'ring-[#ff006e]',
    },
  ]

  const handleCardClick = (id: string) => {
    if (!onFilterChange) return
    if (id === 'TOTAL') {
      onFilterChange(null)
    } else {
      onFilterChange(activeFilter === id ? null : id)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        const isActive = activeFilter === card.id || (card.id === 'TOTAL' && !activeFilter)

        return (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={cn(
              'relative overflow-hidden rounded-[24px] h-[110px] p-5 cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm text-white select-none',
              card.gradient ? `bg-gradient-to-br ${card.gradient}` : 'bg-primary',
              isActive ? `ring-4 ring-offset-2 ring-offset-background ${card.ringColor}` : '',
            )}
          >
            <div className="flex justify-between items-start h-full relative z-10">
              <div className="flex flex-col justify-between h-full">
                <span className="text-white/90 font-medium text-sm">{card.label}</span>
                <span className="text-3xl font-bold">{card.value}</span>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Background icon */}
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <Icon className="w-32 h-32" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
