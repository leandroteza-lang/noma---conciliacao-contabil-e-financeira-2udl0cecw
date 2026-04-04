import React from 'react'
import { ShieldAlert } from 'lucide-react'

interface MetadataProps {
  log: any
}

export const AuditMetadata: React.FC<MetadataProps> = ({ log }) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 mt-4 shadow-sm">
      <h4 className="font-bold text-primary mb-4 flex items-center gap-2 text-sm">
        <ShieldAlert className="w-4 h-4" />
        Metadados de Segurança
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground font-medium text-xs block mb-1">IP de Origem</span>
          <p className="font-mono bg-background px-3 py-1.5 rounded text-xs truncate border">
            {log.ip_address || 'N/A'}
          </p>
        </div>

        <div>
          <span className="text-muted-foreground font-medium text-xs block mb-1">Localização</span>
          <p className="bg-background px-3 py-1.5 rounded text-xs truncate border">
            {log.city || 'N/A'}, {log.country || 'N/A'}
          </p>
        </div>

        <div>
          <span className="text-muted-foreground font-medium text-xs block mb-1">Dispositivo</span>
          <p className="bg-background px-3 py-1.5 rounded text-xs capitalize truncate border">
            {log.device_type || 'N/A'}
          </p>
        </div>

        <div>
          <span className="text-muted-foreground font-medium text-xs block mb-1">Session ID</span>
          <p
            className="font-mono bg-background px-3 py-1.5 rounded text-xs truncate border"
            title={log.session_id}
          >
            {log.session_id || 'N/A'}
          </p>
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <span className="text-muted-foreground font-medium text-xs block mb-1">User Agent</span>
          <p className="font-mono bg-background px-3 py-1.5 rounded text-xs break-all border text-muted-foreground">
            {log.user_agent || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
