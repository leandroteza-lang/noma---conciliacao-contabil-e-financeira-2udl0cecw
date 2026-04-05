import React from 'react'
import { Activity, Clock, ShieldAlert, MonitorSmartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuditDashboardProps {
  logs: any[]
  entityType: string
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ logs }) => {
  const totalLogs = logs.length

  const logsToday = logs.filter((log) => {
    const logDate = new Date(log.performed_at)
    const today = new Date()
    return (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    )
  }).length

  const actionCounts = logs.reduce((acc: any, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {})

  const deviceCounts = logs.reduce((acc: any, log) => {
    const dev = log.device_type || 'unknown'
    acc[dev] = (acc[dev] || 0) + 1
    return acc
  }, {})

  const translateAction = (action: string) => {
    if (action === 'CREATE') return 'INCLUSÃO'
    if (action === 'UPDATE') return 'EDIÇÃO'
    if (action === 'DELETE') return 'EXCLUSÃO'
    if (action === 'IMPORT') return 'IMPORTAÇÃO'
    return action
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="relative overflow-hidden border-0 shadow-[0_6px_0_0_rgba(59,130,246,0.2)] bg-gradient-to-b from-blue-500/10 to-blue-500/5 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(59,130,246,0.2)] transition-all dark:shadow-[0_6px_0_0_rgba(59,130,246,0.1)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Total de Registros
          </CardTitle>
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-blue-800 dark:text-blue-300">{totalLogs}</div>
          <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mt-1">
            Logs retornados na busca
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-[0_6px_0_0_rgba(16,185,129,0.2)] bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(16,185,129,0.2)] transition-all dark:shadow-[0_6px_0_0_rgba(16,185,129,0.1)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Ocorrências Hoje
          </CardTitle>
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300">
            {logsToday}
          </div>
          <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-1">
            Nas últimas 24h
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-[0_6px_0_0_rgba(245,158,11,0.2)] bg-gradient-to-b from-amber-500/10 to-amber-500/5 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(245,158,11,0.2)] transition-all dark:shadow-[0_6px_0_0_rgba(245,158,11,0.1)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Tipos de Ação
          </CardTitle>
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent className="text-sm">
          {Object.keys(actionCounts).length > 0 ? (
            <div className="space-y-1.5 mt-1">
              {Object.entries(actionCounts).map(([action, count]) => (
                <div key={action} className="flex justify-between items-center">
                  <span className="font-semibold text-amber-800/80 dark:text-amber-300/80">
                    {translateAction(action)}
                  </span>
                  <span className="font-black text-amber-900 dark:text-amber-200">
                    {String(count)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-amber-600/70 font-medium text-xs">Nenhuma ação</span>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-[0_6px_0_0_rgba(139,92,246,0.2)] bg-gradient-to-b from-violet-500/10 to-violet-500/5 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(139,92,246,0.2)] transition-all dark:shadow-[0_6px_0_0_rgba(139,92,246,0.1)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
            Dispositivos
          </CardTitle>
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <MonitorSmartphone className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
        </CardHeader>
        <CardContent className="text-sm">
          {Object.keys(deviceCounts).length > 0 ? (
            <div className="space-y-1.5 mt-1">
              {Object.entries(deviceCounts).map(([device, count]) => (
                <div key={device} className="flex justify-between items-center capitalize">
                  <span className="font-semibold text-violet-800/80 dark:text-violet-300/80">
                    {device}
                  </span>
                  <span className="font-black text-violet-900 dark:text-violet-200">
                    {String(count)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-violet-600/70 font-medium text-xs">Nenhum dispositivo</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
