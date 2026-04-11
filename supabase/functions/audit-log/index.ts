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

    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      payload = {};
    }
    
    const logs = Array.isArray(payload) ? payload : [payload];
    const results = [];

    for (const logData of logs) {
      const entityType = logData.entityType || logData.entity_type;
      const entityId = logData.entityId || logData.entity_id;
      const action = logData.action;
      const performedBy = logData.performedBy || logData.performed_by;
      const changes = logData.changes;
      const ipAddress = logData.ipAddress || logData.ip_address;
      const userAgent = logData.userAgent || logData.user_agent;
      const sessionId = logData.sessionId || logData.session_id;
      const country = logData.country;
      const city = logData.city;
      const deviceType = logData.deviceType || logData.device_type;

      if (!entityType || !entityId) {
        console.error("entityType e entityId são obrigatórios", logData);
        continue;
      }

      let finalEntityType = String(entityType).toLowerCase();

      let entityName = null;
      let tableName = '';
      let nameCol = 'name';
      let displayEntityType = String(entityType);

      // PROBLEMA 2 (Valores Exatos / Mapeamento na Edge Function): O array de condições para Contas Bancárias
      // não cobria as variações como 'bank_account' (singular), 'conta bancária' (com acento e espaço) e 'contas',
      // fazendo com que as requisições oriundas do front-end falhassem na identificação e não fossem atreladas à tabela correta.
      // SOLUÇÃO: O array foi expandido para suportar amplamente todas as variações de nomenclatura.
      if (['usuario', 'cadastro_usuarios', 'usuarios'].includes(finalEntityType)) {
        tableName = 'cadastro_usuarios';
        nameCol = 'name';
        displayEntityType = 'Usuários';
      } else if (['bank_accounts', 'bank_account', 'conta_bancaria', 'contas_bancarias', 'contas bancárias', 'conta bancária', 'conta bancaria', 'contas bancarias', 'contas'].includes(finalEntityType)) {
        tableName = 'bank_accounts';
        nameCol = 'description';
        displayEntityType = 'Contas Bancárias';
      } else if (['cost_centers', 'centro_custo', 'centros_de_custo', 'centros de custo'].includes(finalEntityType)) {
        tableName = 'cost_centers';
        nameCol = 'description';
        displayEntityType = 'Centros de Custo';
      } else if (['chart_of_accounts', 'conta_contabil', 'plano_de_contas', 'plano de contas'].includes(finalEntityType)) {
        tableName = 'chart_of_accounts';
        nameCol = 'account_name';
        displayEntityType = 'Plano de Contas';
      } else if (['tipo_conta_tga', 'tga_account_types', 'tipos de conta tga'].includes(finalEntityType)) {
        tableName = 'tipo_conta_tga';
        nameCol = 'nome';
        displayEntityType = 'Tipos de Conta TGA';
      } else if (['departments', 'departamento', 'departamentos'].includes(finalEntityType)) {
        tableName = 'departments';
        nameCol = 'name';
        displayEntityType = 'Departamentos';
      } else if (['organizations', 'empresa', 'empresas'].includes(finalEntityType)) {
        tableName = 'organizations';
        nameCol = 'name';
        displayEntityType = 'Empresas';
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
          entity_type: displayEntityType,
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

      if (logError) {
        console.error("Error inserting audit log:", logError);
        continue;
      }

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
        if (detailsError) {
          console.error("Error inserting audit details:", detailsError);
        }
      }
      
      results.push(auditLog.id);
    }

    return new Response(JSON.stringify({ success: true, ids: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Audit log error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
