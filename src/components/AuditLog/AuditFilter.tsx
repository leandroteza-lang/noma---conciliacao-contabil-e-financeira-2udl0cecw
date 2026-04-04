import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterState {
  action?: string
  fieldName?: string
  performedByEmail?: string
  dateFrom?: string
  dateTo?: string
  ipAddress?: string
  deviceType?: string
  entityId?: string
}

interface FilterProps {
  onFilter: (filters: FilterState) => void
}

export const AuditFilter: React.FC<FilterProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState<FilterState>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    onFilter(filters)
  }

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm border mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Filtros de Auditoria</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Select onValueChange={(val) => handleFilterChange('action', val === 'ALL' ? '' : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as Ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as Ações</SelectItem>
            <SelectItem value="CREATE">Criar (CREATE)</SelectItem>
            <SelectItem value="UPDATE">Atualizar (UPDATE)</SelectItem>
            <SelectItem value="DELETE">Deletar (DELETE)</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          value={filters.dateFrom || ''}
          placeholder="Data Inicial"
          className="w-full"
        />

        <Input
          type="date"
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          value={filters.dateTo || ''}
          placeholder="Data Final"
          className="w-full"
        />

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1 gap-2">
            <Search className="w-4 h-4" /> Buscar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3"
            title="Mais Filtros"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t animate-fade-in-down">
          <Input
            type="text"
            placeholder="Campo alterado (ex: email)"
            onChange={(e) => handleFilterChange('fieldName', e.target.value)}
            value={filters.fieldName || ''}
          />

          <Input
            type="email"
            placeholder="E-mail do responsável"
            onChange={(e) => handleFilterChange('performedByEmail', e.target.value)}
            value={filters.performedByEmail || ''}
          />

          <Input
            type="text"
            placeholder="IP de origem (ex: 192.168.1.1)"
            onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
            value={filters.ipAddress || ''}
          />

          <Select
            onValueChange={(val) => handleFilterChange('deviceType', val === 'ALL' ? '' : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dispositivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="ID da Entidade (UUID)"
            onChange={(e) => handleFilterChange('entityId', e.target.value)}
            value={filters.entityId || ''}
            className="lg:col-span-2"
          />
        </div>
      )}
    </div>
  )
}
