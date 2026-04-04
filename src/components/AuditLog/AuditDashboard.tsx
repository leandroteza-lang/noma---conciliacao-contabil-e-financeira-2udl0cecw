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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Registros
          </CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLogs}</div>
          <p className="text-xs text-muted-foreground mt-1">Logs retornados na busca</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ocorrências Hoje
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{logsToday}</div>
          <p className="text-xs text-muted-foreground mt-1">Nas últimas 24h (filtro atual)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Ação</CardTitle>
          <ShieldAlert className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="text-sm">
          {Object.keys(actionCounts).length > 0 ? (
            <div className="space-y-1 mt-1">
              {Object.entries(actionCounts).map(([action, count]) => (
                <div key={action} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{action}</span>
                  <span className="font-semibold">{String(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Nenhuma ação</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dispositivos</CardTitle>
          <MonitorSmartphone className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="text-sm">
          {Object.keys(deviceCounts).length > 0 ? (
            <div className="space-y-1 mt-1">
              {Object.entries(deviceCounts).map(([device, count]) => (
                <div key={device} className="flex justify-between items-center capitalize">
                  <span className="text-muted-foreground">{device}</span>
                  <span className="font-semibold">{String(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Nenhum dispositivo</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
