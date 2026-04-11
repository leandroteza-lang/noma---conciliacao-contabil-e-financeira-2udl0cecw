import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json();
    const logs = Array.isArray(payload) ? payload : [payload];
    const results = [];

    for (const logData of logs) {
      const {
        entityType,
        entityId,
        action,
        performedBy,
        changes,
        ipAddress,
        userAgent,
        sessionId,
        country,
        city,
        deviceType,
      } = logData;

      let finalEntityType = String(entityType).toLowerCase();
      if (finalEntityType === 'usuarios') finalEntityType = 'usuario';

      let entityName = null;
      let tableName = '';
      let nameCol = 'name';

      if (finalEntityType === 'usuario' || finalEntityType === 'cadastro_usuarios' || finalEntityType === 'usuarios') {
        tableName = 'cadastro_usuarios';
        nameCol = 'name';
      } else if (finalEntityType === 'bank_accounts' || finalEntityType === 'conta_bancaria') {
        tableName = 'bank_accounts';
        nameCol = 'description';
      } else if (finalEntityType === 'cost_centers' || finalEntityType === 'centro_custo') {
        tableName = 'cost_centers';
        nameCol = 'description';
      } else if (finalEntityType === 'chart_of_accounts' || finalEntityType === 'conta_contabil') {
        tableName = 'chart_of_accounts';
        nameCol = 'account_name';
      } else if (finalEntityType === 'tipo_conta_tga' || finalEntityType === 'tga_account_types') {
        tableName = 'tipo_conta_tga';
        nameCol = 'nome';
      } else if (finalEntityType === 'departments' || finalEntityType === 'departamento') {
        tableName = 'departments';
        nameCol = 'name';
      } else if (finalEntityType === 'organizations' || finalEntityType === 'empresa') {
        tableName = 'organizations';
        nameCol = 'name';
      }

      if (tableName) {
        try {
          const { data: record } = await supabase.from(tableName).select(nameCol).eq('id', entityId).maybeSingle();
          if (record && record[nameCol]) {
            entityName = record[nameCol];
          } else {
            const { data: prevLogs } = await supabase
              .from('audit_logs')
              .select('changes')
              .eq('entity_id', entityId)
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (prevLogs) {
              for (const log of prevLogs) {
                if (log.changes) {
                  if (log.changes._entity_name) {
                    entityName = log.changes._entity_name.new || log.changes._entity_name.old || (typeof log.changes._entity_name === 'string' ? log.changes._entity_name : null);
                    if (entityName) break;
                  }
                  if (log.changes.entity_name) {
                    entityName = log.changes.entity_name.new || log.changes.entity_name.old || (typeof log.changes.entity_name === 'string' ? log.changes.entity_name : null);
                    if (entityName) break;
                  }
                  if (log.changes[nameCol]) {
                    entityName = log.changes[nameCol].new || log.changes[nameCol].old || (typeof log.changes[nameCol] === 'string' ? log.changes[nameCol] : null);
                    if (entityName) break;
                  }
                  if (log.changes.name) {
                    entityName = log.changes.name.new || log.changes.name.old || (typeof log.changes.name === 'string' ? log.changes.name : null);
                    if (entityName) break;
                  }
                  if (log.changes.description) {
                    entityName = log.changes.description.new || log.changes.description.old || (typeof log.changes.description === 'string' ? log.changes.description : null);
                    if (entityName) break;
                  }
                  if (log.changes.account_name) {
                    entityName = log.changes.account_name.new || log.changes.account_name.old || (typeof log.changes.account_name === 'string' ? log.changes.account_name : null);
                    if (entityName) break;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error fetching entity name:", e);
        }
      }

      let finalChanges = changes ? { ...changes } : {};
      if (entityName) {
        finalChanges = {
          ...finalChanges,
          _entity_name: { old: entityName, new: entityName },
          entity_name: { old: entityName, new: entityName }
        };
      }

      const { data: auditLog, error: logError } = await supabase
        .from("audit_logs")
        .insert({
          entity_type: finalEntityType,
          entity_id: entityId,
          action,
          performed_by: performedBy,
          changes: Object.keys(finalChanges).length > 0 ? finalChanges : null,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          country: country,
          city: city,
          device_type: deviceType,
        })
        .select()
        .single();

      if (logError) throw logError;

      if (finalChanges && Object.keys(finalChanges).length > 0) {
        const details = Object.entries(finalChanges).map(([field, val]: [string, any]) => {
          let oldVal = null;
          let newVal = null;
          if (val !== null && typeof val === 'object' && ('old' in val || 'new' in val)) {
            oldVal = val.old !== undefined && val.old !== null ? String(val.old) : null;
            newVal = val.new !== undefined && val.new !== null ? String(val.new) : null;
          } else {
            newVal = val !== undefined && val !== null ? String(val) : null;
          }
          return {
            audit_log_id: auditLog.id,
            field_name: field,
            old_value: oldVal,
            new_value: newVal,
          };
        });

        const { error: detailsError } = await supabase.from("audit_details").insert(details);
        if (detailsError) throw detailsError;
      }
      
      results.push(auditLog.id);
    }

    return new Response(JSON.stringify({ success: true, ids: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
