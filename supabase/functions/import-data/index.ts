import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase ausentes')
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')

    let user: any = null
    const payload = await req.json()

    if (payload.action === 'PROCESS_BACKGROUND' && payload.userId) {
      user = { id: payload.userId }
    } else {
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: authHeader,
          apikey: supabaseKey,
        },
      })

      if (!userResponse.ok) {
        const err = await userResponse.json().catch(() => ({}))
        throw new Error(`Usuário não autenticado: ${err.msg || err.message || 'Token inválido'}`)
      }

      user = await userResponse.json()
      if (!user || !user.id) throw new Error('Usuário não autenticado: Token inválido')
    }

    const supabase =
      payload.action === 'PROCESS_BACKGROUND'
        ? supabaseAdmin
        : createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false },
          })

    if (payload.action === 'START_BACKGROUND') {
      const { data: history, error: historyError } = await supabaseAdmin
        .from('import_history')
        .insert({
          user_id: user.id,
          import_type: payload.type,
          file_name: payload.fileName,
          file_path: payload.filePath,
          total_records: payload.totalRecords || 0,
          status: 'Processing',
          organization_id: payload.organizationId,
          mode: payload.mode,
          sheet_name: payload.sheetName,
        })
        .select()
        .single()

      if (historyError) throw new Error('Erro ao iniciar histórico: ' + historyError.message)

      EdgeRuntime.waitUntil(
        (async () => {
          try {
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from('imports')
              .download(payload.filePath)
            if (downloadError)
              throw new Error('Erro ao baixar arquivo do storage: ' + downloadError.message)
            const arrayBuffer = await fileData.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)

            let isCsv = payload.fileName && payload.fileName.toLowerCase().endsWith('.csv')
            let rawRecords: any[] = []
            const dateCols = [
              'DATAEMISSAO',
              'EMISSAO',
              'DTCOMPENS',
              'COMPENSACAO',
              'DATAVENCTO',
              'VENCTO',
              'VENCIMENTO',
              'DATACANC',
              'CANCELAMENTO',
              'DATAESTORNO',
              'ESTORNO',
              'DATA',
            ]
            const numCols = ['VALOR', 'VALORLIQUIDO']

            const safeParseDate = (val: any) => {
              if (val === null || val === undefined || val === '') return null
              const numVal = Number(val)
              if (
                !isNaN(numVal) &&
                String(val).trim() !== '' &&
                numVal > 10000 &&
                numVal < 100000
              ) {
                const date = new Date(Math.round((numVal - 25569) * 86400 * 1000))
                if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
              }
              if (typeof val === 'string') {
                const clean = val.trim().substring(0, 20)
                const ptBrMatch = clean.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
                if (ptBrMatch) {
                  const day = parseInt(ptBrMatch[1], 10)
                  const month = parseInt(ptBrMatch[2], 10)
                  const year = parseInt(ptBrMatch[3], 10)
                  if (
                    year >= 1900 &&
                    year <= 2100 &&
                    month >= 1 &&
                    month <= 12 &&
                    day >= 1 &&
                    day <= 31
                  ) {
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  }
                }
                const isoMatch = clean.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
                if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
              }
              try {
                const d = new Date(val)
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
              } catch (e) {}
              return null
            }

            const safeParseNum = (val: any) => {
              if (val === null || val === undefined || val === '') return null
              if (typeof val === 'number') return val
              let str = String(val).trim()
              const commas = (str.match(/,/g) || []).length
              const dots = (str.match(/\./g) || []).length
              if (dots > 0 && commas > 0) {
                const lastComma = str.lastIndexOf(',')
                const lastDot = str.lastIndexOf('.')
                if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.')
                else str = str.replace(/,/g, '')
              } else if (commas === 1 && dots === 0) str = str.replace(',', '.')
              else if (commas > 1 && dots === 0) str = str.replace(/,/g, '')
              else if (dots > 1 && commas === 0) str = str.replace(/\./g, '')
              str = str.replace(/[^0-9\.\-]/g, '')
              const parsed = parseFloat(str)
              return isNaN(parsed) ? null : parsed
            }

            if (isCsv) {
              let textContent = new TextDecoder('utf-8').decode(bytes)
              if (textContent.includes('\uFFFD'))
                textContent = new TextDecoder('iso-8859-1').decode(bytes)

              const firstLineLimit =
                textContent.indexOf('\n') > -1
                  ? textContent.indexOf('\n')
                  : Math.min(textContent.length, 1000)
              const firstLine = textContent.substring(0, firstLineLimit)
              const delimiter =
                (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
                  ? ';'
                  : ','

              let headers: string[] = []
              let currentRow: string[] = []
              let currentCell = ''
              let inQuotes = false

              for (let i = 0; i < textContent.length; i++) {
                const char = textContent[i]
                const nextChar = textContent[i + 1]
                if (char === '"') {
                  if (inQuotes && nextChar === '"') {
                    currentCell += '"'
                    i++
                  } else {
                    inQuotes = !inQuotes
                  }
                } else if (char === delimiter && !inQuotes) {
                  currentRow.push(currentCell)
                  currentCell = ''
                } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
                  if (char === '\r') i++
                  currentRow.push(currentCell)
                  if (headers.length === 0) {
                    headers = currentRow.map((h) => h.trim())
                  } else if (currentRow.some((c) => c.trim() !== '')) {
                    let rowObj: any = {}
                    for (let j = 0; j < headers.length; j++) {
                      rowObj[headers[j] || `COL${j}`] = currentRow[j] || ''
                    }
                    rawRecords.push(rowObj)
                  }
                  currentRow = []
                  currentCell = ''
                } else {
                  currentCell += char
                }
              }
              if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell)
                if (headers.length > 0 && currentRow.some((c) => c.trim() !== '')) {
                  let rowObj: any = {}
                  for (let j = 0; j < headers.length; j++) {
                    rowObj[headers[j] || `COL${j}`] = currentRow[j] || ''
                  }
                  rawRecords.push(rowObj)
                }
              }
            } else {
              const wb = XLSX.read(bytes, { type: 'array' })
              const sheet = wb.Sheets[payload.sheetName || wb.SheetNames[0]]
              rawRecords = XLSX.utils.sheet_to_json(sheet, { defval: '' })
            }

            const columnMapping = payload.columnMapping || {}
            const normalizedRecords = rawRecords.map((r: any, index: number) => {
              const normalized: any = {}
              normalized._originalIndex = index + 1
              for (const key in r) {
                const mappedKey = columnMapping[key] || key
                const cleanKey = mappedKey
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toUpperCase()
                  .trim()

                let val = r[key]
                if (dateCols.includes(cleanKey)) {
                  val = safeParseDate(val) || ''
                } else if (numCols.includes(cleanKey)) {
                  val = safeParseNum(val)
                  val = val !== null ? val : ''
                } else {
                  val =
                    val !== null && val !== undefined
                      ? String(val)
                          .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
                          .trim()
                      : ''
                }
                normalized[cleanKey] = val
              }
              return normalized
            })

            await supabaseAdmin
              .from('import_history')
              .update({ total_records: normalizedRecords.length })
              .eq('id', history.id)

            const CHUNK_SIZE = 2000
            const totalChunks = Math.ceil(normalizedRecords.length / CHUNK_SIZE)

            if (totalChunks === 0) {
              await supabaseAdmin
                .from('import_history')
                .update({ status: 'Completed', processed_records: 0 })
                .eq('id', history.id)
              return
            }

            const uploadPromises = []
            for (let i = 0; i < totalChunks; i++) {
              const chunk = normalizedRecords.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
              uploadPromises.push(
                supabaseAdmin.storage
                  .from('imports')
                  .upload(`${history.id}/chunk_${i}.json`, JSON.stringify(chunk), {
                    contentType: 'application/json',
                  }),
              )
              if (uploadPromises.length >= 10 || i === totalChunks - 1) {
                await Promise.all(uploadPromises)
                uploadPromises.length = 0
              }
            }

            await fetch(`${supabaseUrl}/functions/v1/import-data`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                action: 'PROCESS_CHUNK',
                importId: history.id,
                type: payload.type,
                chunkIndex: 0,
                totalChunks: totalChunks,
                totalRecords: normalizedRecords.length,
                organizationId: payload.organizationId,
                mode: payload.mode,
                userId: user.id,
                allowIncomplete: payload.allowIncomplete,
                rootMapping: payload.rootMapping,
                columnMapping: payload.columnMapping,
                inserted: 0,
                rejected: 0,
                errors: [],
              }),
            })
          } catch (e: any) {
            console.error('Fast background process error:', e)
            await supabaseAdmin
              .from('import_history')
              .update({
                status: 'Error',
                errors_list: [{ error: e.message }],
              })
              .eq('id', history.id)
          }
        })(),
      )

      return new Response(JSON.stringify({ success: true, importId: history.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let records = payload.records
    const type = payload.type
    const fileName = payload.fileName
    const allowIncomplete = payload.allowIncomplete === true
    const mode = payload.mode || 'UPDATE'
    const simulation = payload.simulation === true
    const organizationId =
      payload.organizationId && payload.organizationId !== 'USE_SPREADSHEET'
        ? payload.organizationId
        : null
    const rootMapping = payload.rootMapping || {}
    const columnMapping = payload.columnMapping || {}

    const createRowAccessor = (row: any) => {
      const cleanRowKeys: Record<string, string> = {}
      const keys = Object.keys(row)
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        cleanRowKeys[
          String(k)
            .replace(/[^A-Z0-9]/gi, '')
            .toUpperCase()
        ] = k
      }
      return (possibleKeys: string[]) => {
        for (let i = 0; i < possibleKeys.length; i++) {
          const cleanPk = String(possibleKeys[i])
            .replace(/[^A-Z0-9]/gi, '')
            .toUpperCase()
          const actualKey = cleanRowKeys[cleanPk]
          if (actualKey !== undefined && row[actualKey] !== undefined) {
            return row[actualKey]
          }
        }
        return null
      }
    }

    const safeParseDate = (val: any) => {
      if (val === null || val === undefined || val === '') return null

      const numVal = Number(val)
      if (!isNaN(numVal) && String(val).trim() !== '' && numVal > 10000 && numVal < 100000) {
        const date = new Date(Math.round((numVal - 25569) * 86400 * 1000))
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      }

      if (typeof val === 'string') {
        const clean = val.trim().substring(0, 20)
        const ptBrMatch = clean.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
        if (ptBrMatch) {
          const day = parseInt(ptBrMatch[1], 10)
          const month = parseInt(ptBrMatch[2], 10)
          const year = parseInt(ptBrMatch[3], 10)
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          }
        }

        const isoMatch = clean.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
        if (isoMatch) {
          const year = parseInt(isoMatch[1], 10)
          const month = parseInt(isoMatch[2], 10)
          const day = parseInt(isoMatch[3], 10)
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          }
        }
      }

      try {
        const d = new Date(val)
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear()
          if (year >= 1900 && year <= 2100) {
            return d.toISOString().split('T')[0]
          }
        }
      } catch (e) {}

      return null
    }

    const safeParseNum = (val: any) => {
      if (val === null || val === undefined || val === '') return null
      if (typeof val === 'number') return val

      let str = String(val).trim()

      const commas = (str.match(/,/g) || []).length
      const dots = (str.match(/\./g) || []).length

      if (dots > 0 && commas > 0) {
        const lastComma = str.lastIndexOf(',')
        const lastDot = str.lastIndexOf('.')
        if (lastComma > lastDot) {
          str = str.replace(/\./g, '').replace(',', '.')
        } else {
          str = str.replace(/,/g, '')
        }
      } else if (commas === 1 && dots === 0) {
        str = str.replace(',', '.')
      } else if (commas > 1 && dots === 0) {
        str = str.replace(/,/g, '')
      } else if (dots > 1 && commas === 0) {
        str = str.replace(/\./g, '')
      }

      str = str.replace(/[^0-9\.\-]/g, '')

      const parsed = parseFloat(str)
      return isNaN(parsed) ? null : parsed
    }

    if (payload.action === 'PROCESS_CHUNK') {
      const { importId, chunkIndex } = payload
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('imports')
        .download(`${importId}/chunk_${chunkIndex}.json`)
      if (dlErr) throw new Error('Erro ao baixar chunk do storage')
      records = JSON.parse(await fileData.text())
    } else if (payload.fileBase64 || payload.filePath) {
      try {
        let bytes: Uint8Array
        if (payload.fileBase64) {
          const binaryString = atob(payload.fileBase64)
          bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
        } else {
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('imports')
            .download(payload.filePath)
          if (downloadError)
            throw new Error('Erro ao baixar arquivo do storage: ' + downloadError.message)
          const arrayBuffer = await fileData.arrayBuffer()
          bytes = new Uint8Array(arrayBuffer)
        }

        let isCsv = payload.fileName && payload.fileName.toLowerCase().endsWith('.csv')
        let textContent = ''
        if (isCsv) {
          textContent = new TextDecoder('utf-8').decode(bytes)
          if (textContent.includes('\uFFFD')) {
            textContent = new TextDecoder('iso-8859-1').decode(bytes)
          }
        }

        let rawRecords: any[] = []
        let sheetNames: string[] = []

        if (isCsv && (textContent.includes(';') || textContent.includes(','))) {
          const parseCSV = (text: string, delimiter: string) => {
            const rows: string[][] = []
            let currentRow: string[] = []
            let currentCell = ''
            let inQuotes = false

            for (let i = 0; i < text.length; i++) {
              const char = text[i]
              const nextChar = text[i + 1]

              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  currentCell += '"'
                  i++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === delimiter && !inQuotes) {
                currentRow.push(currentCell)
                currentCell = ''
              } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
                if (char === '\r') i++
                currentRow.push(currentCell)
                if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
                currentRow = []
                currentCell = ''
              } else {
                currentCell += char
              }
            }
            if (currentCell || currentRow.length > 0) {
              currentRow.push(currentCell)
              if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
            }
            return rows
          }

          const firstLineLimit =
            textContent.indexOf('\n') > -1
              ? textContent.indexOf('\n')
              : Math.min(textContent.length, 1000)
          const firstLine = textContent.substring(0, firstLineLimit)
          const delimiter =
            (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','

          const parsedRows = parseCSV(textContent, delimiter)

          if (parsedRows.length > 0) {
            const headers = parsedRows[0].map((h) => h.trim())
            for (let i = 1; i < parsedRows.length; i++) {
              const values = parsedRows[i].map((v) => v.trim())
              const row: any = {}
              headers.forEach((h, idx) => {
                row[h] = values[idx] || ''
              })
              rawRecords.push(row)
            }
          }
          sheetNames = ['CSV Data']

          if (payload.action === 'PREVIEW') {
            const headers = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : []
            return new Response(
              JSON.stringify({
                sheets: sheetNames,
                headers: headers,
                previewRows: rawRecords.slice(0, 3),
                totalRecords: rawRecords.length,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }

          if (payload.action === 'PARSE_ALL') {
            const headers = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : []
            return new Response(
              JSON.stringify({
                sheets: sheetNames,
                headers: headers,
                records: rawRecords,
                totalRecords: rawRecords.length,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }

          if (payload.action === 'PROCESS_BACKGROUND' && payload.importId) {
            payload.actualTotalRecords = rawRecords.length
          }
        } else {
          const wbSheets = XLSX.read(bytes, { type: 'array', bookSheets: true })
          sheetNames = wbSheets.SheetNames
          const targetSheet =
            payload.sheetName && sheetNames.includes(payload.sheetName)
              ? payload.sheetName
              : sheetNames[0]

          if (payload.action === 'PREVIEW') {
            const workbookPreview = XLSX.read(bytes, { type: 'array', sheets: [targetSheet] })
            const worksheetPreview = workbookPreview.Sheets[targetSheet]
            const previewRawRecords = XLSX.utils.sheet_to_json(worksheetPreview, { defval: '' })
            const headers = previewRawRecords.length > 0 ? Object.keys(previewRawRecords[0]) : []
            return new Response(
              JSON.stringify({
                sheets: sheetNames,
                headers: headers,
                previewRows: previewRawRecords.slice(0, 3),
                totalRecords: previewRawRecords.length,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }

          const workbook = XLSX.read(bytes, { type: 'array', sheets: [targetSheet] })
          const worksheet = workbook.Sheets[targetSheet]
          rawRecords = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        }

        if (payload.action === 'PARSE_ALL') {
          const headers = rawRecords.length > 0 ? Object.keys(rawRecords[0]) : []
          return new Response(
            JSON.stringify({
              sheets: sheetNames,
              headers: headers,
              records: rawRecords,
              totalRecords: rawRecords.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        if (payload.action === 'PROCESS_BACKGROUND' && payload.importId) {
          payload.actualTotalRecords = rawRecords.length
        }

        if (typeof payload.offset === 'number' && typeof payload.limit === 'number') {
          rawRecords = rawRecords.slice(payload.offset, payload.offset + payload.limit)
        }

        records = rawRecords
      } catch (err: any) {
        throw new Error('Erro ao processar o arquivo: ' + err.message)
      }
    }

    if (Array.isArray(records) && payload.action !== 'PROCESS_CHUNK') {
      const erpDateCols = ['DATAEMISSAO', 'DTCOMPENS', 'DATAVENCTO', 'DATACANC', 'DATAESTORNO']
      const erpNumCols = ['VALOR', 'VALORLIQUIDO']

      records = records.map((r: any, index: number) => {
        if (r._originalIndex && Object.keys(r).some((k) => k === k.toUpperCase())) {
          return r // Already normalized
        }
        const normalized: any = {}
        normalized._originalIndex = (payload.offset || 0) + index + 1
        for (const key in r) {
          const mappedKey = columnMapping[key] || key
          const cleanKey = mappedKey
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim()

          let val = r[key]

          if (type === 'ERP_FINANCIAL_MOVEMENTS') {
            if (erpDateCols.includes(cleanKey)) {
              val = safeParseDate(val) || ''
            } else if (erpNumCols.includes(cleanKey)) {
              const num = safeParseNum(val)
              val = num !== null ? num : ''
            }
          }

          normalized[cleanKey] =
            val !== null && val !== undefined
              ? String(val)
                  .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
                  .trim()
              : ''
        }
        return normalized
      })

      if (type === 'COST_CENTERS') {
        records.sort((a: any, b: any) => {
          const getValA = createRowAccessor(a)
          const getValB = createRowAccessor(b)
          const codeA = String(getValA(['COD', 'CODIGO']) || '')
          const codeB = String(getValB(['COD', 'CODIGO']) || '')
          return codeA.length - codeB.length
        })
      }
    }

    const SUPPORTED_TYPES = [
      'BANK_ACCOUNTS',
      'COST_CENTERS',
      'CHART_ACCOUNTS',
      'TGA_ACCOUNTS',
      'MAPPINGS',
      'FINANCIAL_ENTRIES',
      'COMPANIES',
      'DEPARTMENTS',
      'EMPLOYEES',
      'ERP_FINANCIAL_MOVEMENTS',
    ]

    if (!SUPPORTED_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de importação não suportado atualmente por esta função' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error(
        'O formato dos dados é inválido ou a planilha está vazia. Uma lista de registros era esperada.',
      )
    }

    let inserted = 0
    let rejected = 0
    const errors: any[] = []

    const addError = (rowNum: number, msg: string, rowData: any) => {
      rejected++
      if (errors.length < 100) {
        errors.push({ row: rowNum, error: msg })
      } else if (errors.length === 100) {
        errors.push({
          row: 0,
          error: 'Muitos erros encontrados. Exibindo apenas os 100 primeiros.',
        })
      }
    }

    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)

    if (
      orgsError &&
      (type === 'BANK_ACCOUNTS' ||
        type === 'COST_CENTERS' ||
        type === 'CHART_ACCOUNTS' ||
        type === 'TGA_ACCOUNTS' ||
        type === 'MAPPINGS' ||
        type === 'FINANCIAL_ENTRIES')
    ) {
      throw new Error('Erro ao buscar organizações do usuário: ' + orgsError.message)
    }

    const orgMap = new Map<string, string>()
    const validOrgs = new Set<string>()
    if (orgs) {
      orgs.forEach((o: any) => {
        if (o.name) orgMap.set(o.name.trim().toLowerCase(), o.id)
        validOrgs.add(o.id)
      })
    }

    let userProfileId: string | null = null
    if (user && user.id) {
      const { data: profile } = await supabase
        .from('cadastro_usuarios')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile) userProfileId = profile.id
    }

    const resolveOrganization = async (empresaName: any) => {
      if (!empresaName || String(empresaName).trim() === '') return null
      const cleanName = String(empresaName).trim()
      const lowerName = cleanName.toLowerCase()

      let orgId = orgMap.get(lowerName)
      if (orgId) return orgId

      const newOrgId = crypto.randomUUID()
      const { error: insErr } = await supabaseAdmin.from('organizations').insert({
        id: newOrgId,
        name: cleanName,
        user_id: user.id,
        status: true,
      })

      if (!insErr) {
        orgMap.set(lowerName, newOrgId)
        validOrgs.add(newOrgId)
        if (orgs) orgs.push({ id: newOrgId, name: cleanName })

        if (userProfileId) {
          await supabaseAdmin
            .from('cadastro_usuarios_companies')
            .insert({
              usuario_id: userProfileId,
              organization_id: newOrgId,
            })
            .catch(() => {})
        }
        return newOrgId
      }
      return null
    }

    if (type === 'COMPANIES') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const nome = getVal(['NOME', 'RAZAOSOCIAL', 'EMPRESA'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const cnpj = String(getVal(['CNPJ']) || '').trim()
        const cpf = String(getVal(['CPF']) || '').trim()

        if (cnpj) {
          const { data: existingCnpj } = await supabase
            .from('organizations')
            .select('id')
            .eq('cnpj', cnpj)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingCnpj) {
            addError(rowNum, `CNPJ "${cnpj}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase.from('organizations').insert({
          user_id: user.id,
          name: String(nome || `Empresa ${rowNum}`),
          cnpj: cnpj || null,
          cpf: cpf || null,
          email: String(getVal(['EMAIL']) || ''),
          phone: String(getVal(['TELEFONE', 'FONE']) || ''),
          address: String(getVal(['ENDERECO', 'END']) || ''),
          observations: String(getVal(['OBSERVACOES', 'OBS']) || ''),
          status: true,
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'DEPARTMENTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const nome = getVal(['NOME', 'DEPARTAMENTO'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const codigo = String(getVal(['CODIGO', 'COD']) || '').trim()

        if (codigo) {
          const { data: existingCode } = await supabase
            .from('departments')
            .select('id')
            .eq('code', codigo)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingCode) {
            addError(rowNum, `Código "${codigo}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase.from('departments').insert({
          user_id: user.id,
          name: String(nome || `Depto ${rowNum}`),
          code: codigo || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'EMPLOYEES') {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabaseAdmin = supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null

      if (!supabaseAdmin) {
        throw new Error('Configuração de servidor incompleta (Service Role Key ausente).')
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const origin = req.headers.get('origin') || 'https://gestao-de-contas-f8bf6.goskip.app'
      const redirectTo = `${origin}/reset-password`

      const auditLogsToInsert: any[] = []
      const auditDetailsToInsert: any[] = []

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const nome = getVal(['NOME'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME é obrigatória.', row)
          continue
        }

        const email = String(getVal(['EMAIL']) || '').trim()
        if (!email) {
          addError(rowNum, 'A coluna EMAIL é obrigatória para importação de usuários.', row)
          continue
        }

        const rawCpf = String(getVal(['CPF']) || '').trim()
        let cpf = rawCpf
        const cpfDigits = rawCpf.replace(/\D/g, '')
        if (cpfDigits.length === 11) {
          cpf = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        }

        let depId = null
        const depCode = String(getVal(['DEPARTAMENTOCODIGO', 'DEPARTAMENTO']) || '').trim()
        if (depCode) {
          const { data: dep } = await supabase
            .from('departments')
            .select('id')
            .eq('code', depCode)
            .is('deleted_at', null)
            .maybeSingle()
          if (dep) {
            depId = dep.id
          } else if (!allowIncomplete) {
            addError(rowNum, `Departamento "${depCode}" não encontrado.`, row)
            continue
          }
        }

        const action = row['_action'] || 'insert'
        const existingId = row['_existingId']

        const perfil = String(getVal(['PERFIL', 'ROLE']) || 'collaborator').toLowerCase()
        const validRoles = ['admin', 'supervisor', 'collaborator', 'client_user']
        const roleToInsert = validRoles.includes(perfil) ? perfil : 'collaborator'

        if (existingId) {
          if (action === 'restore') {
            const updatePayload: any = {
              approval_status: 'approved',
              pending_deletion: false,
              deletion_requested_at: null,
              deletion_requested_by: null,
              status: true,
              deleted_at: null,
            }

            const { error: updateError } = await supabaseAdmin
              .from('cadastro_usuarios')
              .update(updatePayload)
              .eq('id', existingId)

            if (updateError) {
              addError(rowNum, `Erro ao reativar usuário: ${updateError.message}`, row)
            } else {
              inserted++
              const auditId = crypto.randomUUID()
              auditLogsToInsert.push({
                id: auditId,
                entity_type: 'Usuários',
                entity_id: existingId,
                action: 'UPDATE',
                performed_by: user.id,
                changes: { status: { old: false, new: true } },
              })
              auditDetailsToInsert.push({
                audit_log_id: auditId,
                field_name: 'status',
                old_value: 'false',
                new_value: 'true',
              })
            }
            continue
          } else if (action === 'insert' || action === 'approve') {
            const updatePayload: any = {
              name: String(nome),
              department_id: depId || null,
              role: roleToInsert,
              cpf: cpf || null,
              approval_status: 'approved',
              pending_deletion: false,
              deletion_requested_at: null,
              deletion_requested_by: null,
              status: true,
              deleted_at: null,
            }

            const telefoneVal = getVal(['TELEFONE', 'CELULAR'])
            const enderecoVal = getVal(['ENDERECO', 'END'])
            const obsVal = getVal(['OBSERVACOES', 'OBS'])

            if (telefoneVal !== null && telefoneVal !== undefined)
              updatePayload.phone = String(telefoneVal).trim() || null
            if (enderecoVal !== null && enderecoVal !== undefined)
              updatePayload.address = String(enderecoVal).trim() || null
            if (obsVal !== null && obsVal !== undefined)
              updatePayload.observations = String(obsVal).trim() || null

            const { error: updateError } = await supabaseAdmin
              .from('cadastro_usuarios')
              .update(updatePayload)
              .eq('id', existingId)

            if (updateError) {
              addError(
                rowNum,
                `Erro ao atualizar usuário pela planilha: ${updateError.message}`,
                row,
              )
            } else {
              inserted++
              const auditId = crypto.randomUUID()
              const changes: any = {}
              Object.keys(updatePayload).forEach((k) => {
                changes[k] = { new: updatePayload[k] }
              })
              auditLogsToInsert.push({
                id: auditId,
                entity_type: 'Usuários',
                entity_id: existingId,
                action: 'UPDATE',
                performed_by: user.id,
                changes,
              })
              Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
                auditDetailsToInsert.push({
                  audit_log_id: auditId,
                  field_name: field,
                  new_value: newVal !== null ? String(newVal) : null,
                })
              })
            }
            continue
          }
        }

        // Validate duplicates for completely new inserts
        const { data: existingUserId } = await supabaseAdmin.rpc('get_auth_user_by_email', {
          p_email: email,
        })
        if (existingUserId) {
          addError(rowNum, `E-mail "${email}" já está em uso no sistema.`, row)
          continue
        }

        if (cpf) {
          const { data: existingUserCpf } = await supabaseAdmin
            .from('cadastro_usuarios')
            .select('id')
            .eq('cpf', cpf)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingUserCpf) {
            addError(rowNum, `CPF "${cpf}" já está em uso por outro usuário ativo.`, row)
            continue
          }
        }

        const { data: inviteData, error: inviteError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: { redirectTo },
            data: {
              name: String(nome),
              role: roleToInsert,
              cpf: cpf || null,
              phone: String(getVal(['TELEFONE', 'CELULAR']) || '') || null,
              department_id: depId || null,
              admin_id: user.id,
            },
          })

        if (inviteError) {
          addError(rowNum, `Erro ao convidar: ${inviteError.message}`, row)
          continue
        }

        if (inviteData.user) {
          let profile = null
          for (let retries = 0; retries < 3; retries++) {
            const { data } = await supabaseAdmin
              .from('cadastro_usuarios')
              .select('id')
              .eq('user_id', inviteData.user.id)
              .maybeSingle()
            if (data) {
              profile = data
              break
            }
            await new Promise((r) => setTimeout(r, 500))
          }

          if (profile) {
            await supabaseAdmin
              .from('cadastro_usuarios')
              .update({
                address: String(getVal(['ENDERECO', 'END']) || '') || null,
                observations: String(getVal(['OBSERVACOES', 'OBS']) || '') || null,
              })
              .eq('id', profile.id)

            const auditId = crypto.randomUUID()
            const changes = {
              name: { new: String(nome) },
              email: { new: email },
              role: { new: roleToInsert },
              cpf: { new: cpf || null },
              department_id: { new: depId || null },
            }
            auditLogsToInsert.push({
              id: auditId,
              entity_type: 'Usuários',
              entity_id: profile.id,
              action: 'CREATE',
              performed_by: user.id,
              changes,
            })
            Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
              auditDetailsToInsert.push({
                audit_log_id: auditId,
                field_name: field,
                new_value: newVal !== null ? String(newVal) : null,
              })
            })
          } else {
            console.error('Profile not found after retries for user:', inviteData.user.id)
          }

          const actionLink = inviteData.properties?.action_link
          if (actionLink && resendApiKey) {
            const subject = 'Convite de Acesso - Gestão de Contas'
            const htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #0f172a; margin: 0;">Gestão de Contas</h1>
                </div>
                <h2 style="color: #0f172a; text-align: center;">Bem-vindo(a)!</h2>
                <p style="color: #334155; font-size: 16px;">Olá <strong>${nome}</strong>,</p>
                <p style="color: #334155; font-size: 16px;">Você foi convidado(a) para acessar o sistema.</p>
                <p style="color: #334155; font-size: 16px;">Para aceitar o convite e configurar sua senha, clique no botão abaixo:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${actionLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Aceitar Convite</a>
                </div>
                <p style="color: #64748b; font-size: 14px; text-align: center;">Se o botão não funcionar, copie e cole este link no seu navegador:<br><br><a href="${actionLink}" style="color: #2563eb; word-break: break-all;">${actionLink}</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
              </div>
            `
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'Gestão de Contas <onboarding@resend.dev>',
                to: [email],
                subject: subject,
                html: htmlBody,
              }),
            }).catch((e) => console.error('Erro ao enviar email', e))
          }
        }
        inserted++
      }

      if (auditLogsToInsert.length > 0) {
        const { error: logsError } = await supabaseAdmin
          .from('audit_logs')
          .insert(auditLogsToInsert)
        if (logsError) console.error('Error inserting audit logs:', logsError)

        if (auditDetailsToInsert.length > 0) {
          for (let i = 0; i < auditDetailsToInsert.length; i += 1000) {
            const { error: detailsError } = await supabaseAdmin
              .from('audit_details')
              .insert(auditDetailsToInsert.slice(i, i + 1000))
            if (detailsError) console.error('Error inserting audit details:', detailsError)
          }
        }
      }
    } else if (type === 'BANK_ACCOUNTS') {
      let existingAccounts: any[] = []
      let fetchHasMore = true
      let fetchPage = 0
      while (fetchHasMore) {
        const { data: pageData, error: existingAccError } = await supabase
          .from('bank_accounts')
          .select('id, organization_id, account_number, check_digit')
          .is('deleted_at', null)
          .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

        if (existingAccError) {
          throw new Error('Erro ao buscar contas bancárias existentes: ' + existingAccError.message)
        }

        if (pageData && pageData.length > 0) {
          existingAccounts.push(...pageData)
          fetchPage++
          if (pageData.length < 1000) fetchHasMore = false
        } else {
          fetchHasMore = false
        }
      }

      const normalizeAcc = (str: any) =>
        String(str || '')
          .replace(/[^0-9A-Z]/gi, '')
          .toUpperCase()
          .replace(/^0+/, '') || '0'

      const existingAccSet = new Set(
        existingAccounts?.map(
          (a: any) =>
            `${a.organization_id}-${normalizeAcc(a.account_number)}-${normalizeAcc(a.check_digit)}`,
        ) || [],
      )

      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }

      const toInsertBankAccounts = []

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const empresa = getVal(['EMPRESA'])
        const contaContabil = getVal(['CONTACONTABIL', 'CONTA_CONTABIL'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = await resolveOrganization(empresa)
          if (!orgId && empresa) {
            addError(rowNum, `Erro ao resolver ou criar a empresa "${empresa}". (Obrigatório)`, row)
            continue
          }
        }

        const rawAccountNumber = String(
          getVal(['NROCONTA', 'NUMERODACONTA', 'CONTA', 'NUMERO']) || '',
        ).trim()
        const rawCheckDigit = String(getVal(['DIGITOCONTA', 'DIGITO', 'DV']) || '').trim()

        const normalizedAcc = normalizeAcc(rawAccountNumber)
        const normalizedDigit = normalizeAcc(rawCheckDigit)
        const accountKey = `${orgId}-${normalizedAcc}-${normalizedDigit}`

        if (existingAccSet.has(accountKey)) {
          addError(
            rowNum,
            `A Conta Bancária com número "${rawAccountNumber}" e dígito "${rawCheckDigit}" já está cadastrada para esta empresa.`,
            row,
          )
          continue
        }

        toInsertBankAccounts.push({
          organization_id: orgId,
          account_code: String(contaContabil || ''),
          account_type: String(getVal(['CODCAIXA', 'TIPODECONTA', 'TIPO']) || ''),
          description: String(getVal(['DESCRICAO', 'NOME']) || ''),
          bank_code: String(getVal(['NUMBANCO', 'BANCO', 'CODBANCO']) || ''),
          agency: String(getVal(['NUMAGENCIA', 'AGENCIA']) || ''),
          account_number: rawAccountNumber,
          classification: String(getVal(['CLASSIFICACAO']) || ''),
          check_digit: rawCheckDigit,
          company_name: String(empresa || ''),
          _rowNum: rowNum,
        })
        existingAccSet.add(accountKey)
      }

      for (let i = 0; i < toInsertBankAccounts.length; i += 100) {
        const chunk = toInsertBankAccounts.slice(i, i + 100)
        const dbChunk = chunk.map((c) => {
          const { _rowNum, ...rest } = c
          return rest
        })
        const { error: insErr } = await supabaseAdmin.from('bank_accounts').insert(dbChunk)
        if (insErr) {
          console.error(`[BANK_ACCOUNTS] Insert error:`, insErr)
          chunk.forEach((c: any) => {
            addError(
              c._rowNum,
              `Erro na inserção: ${insErr.message} - Conta: ${c.account_number}`,
              c,
            )
          })
        } else {
          inserted += chunk.length
        }
      }
    } else if (type === 'COST_CENTERS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }

      const recordsByOrg = new Map<string, any[]>()

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)
        const empresa = getVal(['EMPRESA'])

        let orgId = organizationId
        if (!orgId) {
          if (!empresa || String(empresa).trim() === '') {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }
          orgId = await resolveOrganization(empresa)
          if (!orgId) {
            addError(rowNum, `Erro ao resolver ou criar a empresa "${empresa}". (Obrigatório)`, row)
            continue
          }
        }

        if (!recordsByOrg.has(orgId)) {
          recordsByOrg.set(orgId, [])
        }
        recordsByOrg.get(orgId)!.push({ row, rowNum, getVal })
      }

      let totalToInsert = 0
      let totalToUpdate = 0
      let totalToDelete = 0
      const simulationDetails = []

      for (const [orgId, orgRecords] of recordsByOrg.entries()) {
        if (!orgId) continue

        let existingCCs: any[] = []
        let fetchHasMoreCC = true
        let fetchPageCC = 0
        while (fetchHasMoreCC) {
          const { data: pageData, error: ccErr } = await supabase
            .from('cost_centers')
            .select('*')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPageCC * 1000, (fetchPageCC + 1) * 1000 - 1)

          if (ccErr) throw new Error(`Erro ao buscar centros de custo: ${ccErr.message}`)
          if (pageData && pageData.length > 0) {
            existingCCs.push(...pageData)
            fetchPageCC++
            if (pageData.length < 1000) fetchHasMoreCC = false
          } else {
            fetchHasMoreCC = false
          }
        }

        const ccCodeMap = new Map<string, any>()
        existingCCs.forEach((cc) => {
          if (cc.code) ccCodeMap.set(cc.code.trim(), cc)
        })

        let existingTga: any[] = []
        let fetchHasMoreTga = true
        let fetchPageTga = 0
        while (fetchHasMoreTga) {
          const { data: pageData, error: tgaErr } = await supabase
            .from('tipo_conta_tga')
            .select('id, nome, codigo')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPageTga * 1000, (fetchPageTga + 1) * 1000 - 1)

          if (tgaErr) throw new Error(`Erro ao buscar tipos TGA: ${tgaErr.message}`)
          if (pageData && pageData.length > 0) {
            existingTga.push(...pageData)
            fetchPageTga++
            if (pageData.length < 1000) fetchHasMoreTga = false
          } else {
            fetchHasMoreTga = false
          }
        }

        const tgaNameMap = new Map<string, string>()
        const tgaCodeMap = new Map<string, string>()
        existingTga.forEach((tga) => {
          if (tga.nome) tgaNameMap.set(tga.nome.trim().toLowerCase(), tga.id)
          if (tga.codigo) tgaCodeMap.set(tga.codigo.trim().toUpperCase(), tga.id)
        })

        const toInsert: any[] = []
        const toUpdate: any[] = []
        const processedIds = new Set<string>()

        for (const item of orgRecords) {
          const { row, rowNum, getVal } = item
          const code = getVal(['COD', 'CODIGO'])
          const description = getVal(['DESCRICAO', 'NOME'])

          if (!allowIncomplete && (!code || String(code).trim() === '')) {
            addError(rowNum, 'A coluna Código está vazia.', row)
            continue
          }

          if (!allowIncomplete && (!description || String(description).trim() === '')) {
            addError(rowNum, 'A coluna Descrição está vazia.', row)
            continue
          }

          const strCode = String(code || '').trim()

          let parentId = null
          if (strCode.includes('.')) {
            const codeParts = strCode.split('.')
            codeParts.pop()
            const parentCode = codeParts.join('.')

            const parent = ccCodeMap.get(parentCode)
            parentId = parent?.id

            if (!parentId && !allowIncomplete) {
              addError(
                rowNum,
                `Centro de custo pai "${parentCode}" não encontrado para hierarquia.`,
                row,
              )
              continue
            }
          }

          let tipoTgaId = null
          const strTipoTga = String(getVal(['TIPOTGA']) || '').trim()
          if (strTipoTga) {
            const byName = tgaNameMap.get(strTipoTga.toLowerCase())
            const byCode = tgaCodeMap.get(strTipoTga.toUpperCase())

            tipoTgaId = byName || byCode || null

            if (!tipoTgaId && !allowIncomplete) {
              addError(rowNum, `Tipo TGA "${strTipoTga}" não encontrado.`, row)
              continue
            }
          }

          const payloadData = {
            organization_id: orgId,
            code: strCode,
            description: String(description || ''),
            parent_id: parentId || null,
            type_tga: String(getVal(['TIPO']) || ''),
            tipo_tga_id: tipoTgaId,
            fixed_variable: String(getVal(['FIXOOUVARIAVEL', 'FIXO_VARIAVEL']) || ''),
            classification: String(getVal(['CLASSIFICACAO']) || ''),
            operational: String(getVal(['OPERACIONAL']) || ''),
            tipo_lcto: String(getVal(['TIPOLCTO', 'TIPO_LCTO']) || ''),
            contabiliza: String(getVal(['CONTABILIZA']) || ''),
            observacoes: String(getVal(['OBSERVACOES']) || ''),
          }

          const existing = ccCodeMap.get(strCode)

          if (existing) {
            if (existing.is_temp) {
              addError(rowNum, `Centro de Custo duplicado na planilha: "${strCode}".`, row)
            } else {
              if (mode !== 'INSERT_ONLY') {
                toUpdate.push({ ...payloadData, id: existing.id, _rowNum: rowNum })
                processedIds.add(existing.id)
                ccCodeMap.set(strCode, { ...existing, is_temp: true })
              } else {
                processedIds.add(existing.id)
              }
            }
          } else {
            const newId = crypto.randomUUID()
            ccCodeMap.set(strCode, { id: newId, is_temp: true })
            toInsert.push({ ...payloadData, id: newId, _rowNum: rowNum })
          }
        }

        let toDeleteIds: string[] = []
        if (mode === 'REPLACE') {
          toDeleteIds = existingCCs
            .filter((c: any) => !processedIds.has(c.id))
            .map((c: any) => c.id)
        }

        totalToInsert += toInsert.length
        totalToUpdate += toUpdate.length
        totalToDelete += toDeleteIds.length

        simulationDetails.push({
          orgId,
          toInsert: toInsert.length,
          toUpdate: toUpdate.length,
          toDelete: toDeleteIds.length,
        })

        if (!simulation) {
          if (existingCCs.length > 0) {
            await supabase.from('cost_centers_backup').insert({
              organization_id: orgId,
              user_id: user.id,
              data: existingCCs,
            })
          }

          if (toDeleteIds.length > 0) {
            for (let i = 0; i < toDeleteIds.length; i += 100) {
              await supabaseAdmin
                .from('cost_centers')
                .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
                .in('id', toDeleteIds.slice(i, i + 100))
            }
          }

          for (let i = 0; i < toInsert.length; i += 100) {
            const chunk = toInsert.slice(i, i + 100)
            const dbChunk = chunk.map((c: any) => {
              const { _rowNum, ...rest } = c
              return rest
            })
            const { error: insErr } = await supabaseAdmin.from('cost_centers').insert(dbChunk)
            if (insErr) {
              console.error(`[COST_CENTERS] Insert error:`, insErr)
              chunk.forEach((c: any) => {
                addError(c._rowNum, `Erro na inserção: ${insErr.message} - Código: ${c.code}`, c)
              })
            }
          }

          for (let i = 0; i < toUpdate.length; i += 100) {
            const chunk = toUpdate.slice(i, i + 100)
            const dbChunk = chunk.map((c: any) => {
              const { _rowNum, ...rest } = c
              return rest
            })
            const { error: updErr } = await supabaseAdmin.from('cost_centers').upsert(dbChunk)
            if (updErr) {
              console.error(`[COST_CENTERS] Upsert error:`, updErr)
              chunk.forEach((c: any) => {
                addError(c._rowNum, `Erro na atualização: ${updErr.message} - Código: ${c.code}`, c)
              })
            }
          }

          inserted += toInsert.length + toUpdate.length
        }
      }

      if (simulation) {
        return new Response(
          JSON.stringify({
            simulation: true,
            totalToInsert,
            totalToUpdate,
            totalToDelete,
            details: simulationDetails,
            errors,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    } else if (type === 'CHART_ACCOUNTS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      const recordsByOrg = new Map<string, any[]>()

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)
        const empresa = getVal(['EMPRESA'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = await resolveOrganization(empresa)
          if (!orgId && empresa) {
            addError(rowNum, `Erro ao resolver ou criar a empresa "${empresa}".`, row)
            continue
          }
        }

        if (!recordsByOrg.has(orgId)) recordsByOrg.set(orgId, [])
        recordsByOrg.get(orgId)!.push({ row, rowNum, getVal })
      }

      let totalToInsert = 0
      let totalToUpdate = 0
      let totalToDelete = 0
      let detectedMasks = new Set<string>()
      let uniqueRoots = new Set<string>()

      const sanitize = (str: string | null) =>
        String(str || '')
          .replace(/\s+/g, '')
          .toLowerCase()
          .trim()
      const detectMask = (str: string) => str.replace(/\d/g, 'X')

      const simulationDetails = []

      for (const [orgId, orgRecords] of recordsByOrg.entries()) {
        let existingContas: any[] = []
        let fetchHasMore = true
        let fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: fetchError } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (fetchError) {
            throw new Error(`Erro ao buscar plano de contas existente: ${fetchError.message}`)
          }

          if (pageData && pageData.length > 0) {
            existingContas.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }

        const existingByKey = new Map<string, any>()
        const allClassifications = new Set<string>()

        existingContas.forEach((c: any) => {
          const sClass = sanitize(c.classification)
          const sCode = sanitize(c.account_code)
          const key = `${sCode}|${sClass}`
          if (sCode && sClass) existingByKey.set(key, c)

          if (c.classification) {
            detectedMasks.add(detectMask(c.classification.trim()))
            allClassifications.add(c.classification.trim())
          }
        })

        const toInsert: any[] = []
        const toUpdate: any[] = []
        const processedIds = new Set<string>()
        const parsedRows = []

        for (const item of orgRecords) {
          const { row, rowNum, getVal } = item

          const code = getVal([
            'CODIGOREDUZIDO',
            'CODIGO',
            'REDUZIDO',
            'CODIGODACONTA',
            'CODCONTA',
            'COD',
            'CODIGOCONTA',
            'CONTAREDUZIDA',
          ])
          const name = getVal([
            'NOMEDACONTA',
            'NOME',
            'DESCRICAO',
            'CONTA',
            'TITULO',
            'NOMECONTA',
            'DESCRICAOCONTA',
          ])
          const accountType = getVal(['TIPODECONTA', 'TIPO', 'GRUPOCONTABIL', 'TIPOCONTA'])
          const classification = getVal([
            'CLASSIFICACAO',
            'CONTACONTABIL',
            'MASCARA',
            'CODIGOCLASSIFICACAO',
            'ESTRUTURA',
            'NIVEL',
            'CLASSIFICACAOCONTA',
            'MASCARACONTA',
          ])
          const nature = getVal(['NATUREZA', 'NATUREZACONTA'])
          const accountBehavior = getVal(['COMPORTAMENTO', 'TIPOLANCAMENTO', 'TIPOCOMPORTAMENTO'])

          const isEmpty = (v: any) => v === null || v === undefined || String(v).trim() === ''

          if (isEmpty(code) && isEmpty(name)) {
            continue
          }

          if (!allowIncomplete && isEmpty(code)) {
            addError(item.rowNum, 'A coluna Código Reduzido está vazia ou não foi encontrada.', row)
            continue
          }
          if (!allowIncomplete && isEmpty(name)) {
            addError(item.rowNum, 'A coluna Nome da Conta está vazia ou não foi encontrada.', row)
            continue
          }
          if (!allowIncomplete && isEmpty(classification)) {
            addError(
              item.rowNum,
              'A coluna Classificação está vazia ou a coluna não foi encontrada. Certifique-se de que a planilha contém uma coluna chamada "Classificação" ou "Classificacao Conta".',
              row,
            )
            continue
          }

          const strCode = String(code || '').trim()
          let strClass = String(classification || '').trim()

          const maskStr = getVal(['MASCARAPARAMETRO', 'MASCARARELATORIO', 'FORMATO'])
          if (maskStr && strClass && !strClass.includes('.')) {
            let formatted = ''
            let charIndex = 0
            const maskPattern = String(maskStr)
            for (let i = 0; i < maskPattern.length; i++) {
              if (maskPattern[i] === '.' || maskPattern[i] === '-') {
                if (charIndex < strClass.length) {
                  formatted += maskPattern[i]
                }
              } else {
                if (charIndex < strClass.length) {
                  formatted += strClass[charIndex++]
                } else {
                  break
                }
              }
            }
            strClass = formatted.replace(/[\.\-]+$/, '')
          }

          if (strClass && !strClass.includes('.')) {
            const knownMasks = Array.from(detectedMasks)
            const matchedMask = knownMasks.find(
              (m) => m.replace(/\./g, '').length === strClass.length,
            )
            if (matchedMask) {
              let formatted = ''
              let charIndex = 0
              for (let i = 0; i < matchedMask.length; i++) {
                if (matchedMask[i] === '.') formatted += '.'
                else formatted += strClass[charIndex++]
              }
              strClass = formatted
            }
          }

          if (strClass) {
            detectedMasks.add(detectMask(strClass))
            allClassifications.add(strClass)
            uniqueRoots.add(strClass.split(/[\.-]/)[0])
          }

          parsedRows.push({
            ...item,
            strCode,
            strClass,
            name,
            accountType,
            nature,
            accountBehavior,
          })
        }

        const classList = Array.from(allClassifications)

        for (const item of parsedRows) {
          const { row, strCode, strClass, name, accountType, nature, accountBehavior } = item

          const isSynthetic = strClass
            ? classList.some(
                (c) =>
                  c.length > strClass.length &&
                  (c.startsWith(strClass + '.') || c.startsWith(strClass + '-')),
              )
            : false
          const account_level = isSynthetic ? 'Sintética' : 'Analítica'

          const rootClass = strClass ? strClass.split(/[\.-]/)[0] : ''
          const mapping = rootMapping[rootClass] || {}

          const sClass = sanitize(strClass)
          const sCode = sanitize(strCode)
          const key = `${sCode}|${sClass}`
          const existing = key !== '|' ? existingByKey.get(key) : null

          const payloadData = {
            organization_id: orgId,
            account_code: strCode,
            account_name: String(name || ''),
            account_type: mapping.account_type || String(accountType || ''),
            classification: strClass,
            account_level: account_level,
            nature: mapping.nature || (nature ? String(nature) : null),
            account_behavior:
              mapping.account_behavior || (accountBehavior ? String(accountBehavior) : null),
          }

          if (existing) {
            if (existing.is_temp) {
              addError(
                item.rowNum,
                `Conta duplicada na própria planilha: A combinação de Código Reduzido "${strCode}" e Classificação "${strClass}" aparece mais de uma vez.`,
                row,
              )
            } else {
              if (mode !== 'INSERT_ONLY') {
                const updateRef = { ...payloadData, id: existing.id, _rowNum: item.rowNum }
                toUpdate.push(updateRef)
                processedIds.add(existing.id)

                if (key !== '|') existingByKey.set(key, { is_temp: true, ref: updateRef })
              } else {
                processedIds.add(existing.id)
              }
            }
          } else {
            const newRef = { ...payloadData, _rowNum: item.rowNum }
            toInsert.push(newRef)

            if (key !== '|') existingByKey.set(key, { is_temp: true, ref: newRef })
          }
        }

        let toDeleteIds: string[] = []
        if (mode === 'REPLACE') {
          toDeleteIds = existingContas
            .filter((c: any) => !processedIds.has(c.id))
            .map((c: any) => c.id)
        }

        totalToInsert += toInsert.length
        totalToUpdate += toUpdate.length
        totalToDelete += toDeleteIds.length

        simulationDetails.push({
          orgId,
          toInsert: toInsert.length,
          toUpdate: toUpdate.length,
          toDelete: toDeleteIds.length,
        })

        if (!simulation) {
          if (existingContas.length > 0) {
            await supabase.from('chart_of_accounts_backup').insert({
              organization_id: orgId,
              user_id: user.id,
              data: existingContas,
            })
          }

          if (toDeleteIds.length > 0) {
            for (let i = 0; i < toDeleteIds.length; i += 100) {
              await supabase
                .from('chart_of_accounts')
                .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
                .in('id', toDeleteIds.slice(i, i + 100))
            }
          }

          for (let i = 0; i < toInsert.length; i += 100) {
            const chunk = toInsert.slice(i, i + 100)
            const dbChunk = chunk.map((c: any) => {
              const { _rowNum, ...rest } = c
              return rest
            })
            const { error: insErr } = await supabaseAdmin.from('chart_of_accounts').insert(dbChunk)
            if (insErr) {
              console.error(`[CHART_ACCOUNTS] Insert error:`, insErr)
              chunk.forEach((c: any) =>
                addError(c._rowNum, `Erro na inserção: ${insErr.message}`, c),
              )
            }
          }

          for (let i = 0; i < toUpdate.length; i += 100) {
            const chunk = toUpdate.slice(i, i + 100)
            const dbChunk = chunk.map((c: any) => {
              const { _rowNum, ...rest } = c
              return rest
            })
            const { error: updErr } = await supabaseAdmin.from('chart_of_accounts').upsert(dbChunk)
            if (updErr) {
              console.error(`[CHART_ACCOUNTS] Upsert error:`, updErr)
              chunk.forEach((c: any) =>
                addError(c._rowNum, `Erro na atualização: ${updErr.message}`, c),
              )
            }
          }

          inserted += toInsert.length + toUpdate.length
        }
      }

      if (simulation) {
        const sortedRoots = Array.from(uniqueRoots).sort((a, b) => {
          const numA = parseInt(a)
          const numB = parseInt(b)
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB
          return a.localeCompare(b)
        })

        return new Response(
          JSON.stringify({
            simulation: true,
            detectedMasks: Array.from(detectedMasks),
            uniqueRoots: sortedRoots,
            totalToInsert,
            totalToUpdate,
            totalToDelete,
            details: simulationDetails,
            errors,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    } else if (type === 'TGA_ACCOUNTS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }

      let existingTgas: any[] = []
      let fetchHasMore = true
      let fetchPage = 0
      while (fetchHasMore) {
        const { data: pageData, error: fetchErr } = await supabase
          .from('tipo_conta_tga')
          .select('id, codigo, organization_id')
          .is('deleted_at', null)
          .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

        if (fetchErr) throw new Error('Erro ao buscar contas TGA existentes: ' + fetchErr.message)
        if (pageData && pageData.length > 0) {
          existingTgas.push(...pageData)
          fetchPage++
          if (pageData.length < 1000) fetchHasMore = false
        } else {
          fetchHasMore = false
        }
      }

      const existingTgaSet = new Set(
        existingTgas.map(
          (t: any) => `${t.organization_id || 'null'}-${String(t.codigo).trim().toUpperCase()}`,
        ),
      )

      const toInsertTga = []

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const empresa = getVal(['EMPRESA'])
        const codigo = getVal(['CODIGO', 'COD'])
        const nome = getVal(['NOME', 'DESCRICAO'])
        const abreviacao = getVal(['ABREVIACAO', 'SIGLA'])
        const observacoes = getVal(['OBSERVACOES', 'OBS'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }
          orgId = await resolveOrganization(empresa)
        }

        if (!allowIncomplete && (!codigo || String(codigo).trim() === '')) {
          addError(rowNum, 'A coluna Código está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna Nome está vazia.', row)
          continue
        }

        const strCodigo = String(codigo || '').trim()
        const tgaKey = `${orgId || 'null'}-${strCodigo.toUpperCase()}`

        if (existingTgaSet.has(tgaKey)) {
          addError(rowNum, `O Código TGA "${strCodigo}" já está cadastrado para esta empresa.`, row)
          continue
        }

        toInsertTga.push({
          organization_id: orgId || null,
          codigo: strCodigo,
          nome: String(nome || ''),
          abreviacao: abreviacao ? String(abreviacao).trim().substring(0, 10) : null,
          observacoes: observacoes ? String(observacoes) : null,
          _rowNum: rowNum,
        })

        existingTgaSet.add(tgaKey)
      }

      for (let i = 0; i < toInsertTga.length; i += 100) {
        const chunk = toInsertTga.slice(i, i + 100)
        const dbChunk = chunk.map((c) => {
          const { _rowNum, ...rest } = c
          return rest
        })
        const { error: insErr } = await supabaseAdmin.from('tipo_conta_tga').insert(dbChunk)
        if (insErr) {
          console.error(`[TGA_ACCOUNTS] Insert error:`, insErr)
          chunk.forEach((c: any) => {
            addError(c._rowNum, `Erro na inserção: ${insErr.message} - Código: ${c.codigo}`, c)
          })
        } else {
          inserted += chunk.length
        }
      }
    } else if (type === 'MAPPINGS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }

      const recordsByOrg = new Map<string, any[]>()

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const empresa = getVal(['EMPRESA'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = await resolveOrganization(empresa)
          if (!orgId && empresa) {
            addError(rowNum, `Erro ao resolver ou criar a empresa "${empresa}". (Obrigatório)`, row)
            continue
          }
        }

        if (!recordsByOrg.has(orgId)) recordsByOrg.set(orgId, [])
        recordsByOrg.get(orgId)!.push({ row, rowNum, getVal })
      }

      for (const [orgId, orgRecords] of recordsByOrg.entries()) {
        if (!orgId) continue

        let existingCCs: any[] = []
        let fetchHasMore = true
        let fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: errCC } = await supabase
            .from('cost_centers')
            .select('id, code')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (errCC) throw new Error(`Erro ao buscar centros de custo: ${errCC.message}`)
          if (pageData && pageData.length > 0) {
            existingCCs.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }
        const ccMap = new Map<string, string>()
        existingCCs.forEach((cc) => {
          if (cc.code) ccMap.set(cc.code.trim().toUpperCase(), cc.id)
        })

        let existingCAs: any[] = []
        fetchHasMore = true
        fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: errCA } = await supabase
            .from('chart_of_accounts')
            .select('id, account_code')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (errCA) throw new Error(`Erro ao buscar contas contábeis: ${errCA.message}`)
          if (pageData && pageData.length > 0) {
            existingCAs.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }
        const caMap = new Map<string, string>()
        existingCAs.forEach((ca) => {
          if (ca.account_code) caMap.set(ca.account_code.trim().toUpperCase(), ca.id)
        })

        let existingMappings: any[] = []
        fetchHasMore = true
        fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: errMap } = await supabase
            .from('account_mapping')
            .select('id, cost_center_id, chart_account_id')
            .eq('organization_id', orgId)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (errMap) throw new Error(`Erro ao buscar mapeamentos existentes: ${errMap.message}`)
          if (pageData && pageData.length > 0) {
            existingMappings.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }
        const existingMappingsByCC = new Map<string, any>()
        existingMappings.forEach((m) => {
          if (m.cost_center_id) existingMappingsByCC.set(m.cost_center_id, m)
        })

        const toInsert: any[] = []
        const toUpdate: any[] = []
        const processedCCIds = new Set<string>()

        for (const item of orgRecords) {
          const { row, rowNum, getVal } = item

          const centroCusto = getVal([
            'CENTROCUSTO',
            'CENTRODECUSTO',
            'CODIGOCENTROCUSTO',
            'CODIGOTGA',
            'TGA',
            'COD',
            'CC',
          ])
          const contaContabil = getVal([
            'CONTACONTABIL',
            'CODIGOREDUZIDO',
            'REDUZIDO',
            'CONTA',
            'CODCONTABIL',
          ])
          const tipoMapeamento = getVal(['TIPOMAPEAMENTO', 'TIPO'])

          if (!allowIncomplete && (!centroCusto || String(centroCusto).trim() === '')) {
            addError(rowNum, 'A coluna Centro de Custo está vazia.', row)
            continue
          }
          if (!allowIncomplete && (!contaContabil || String(contaContabil).trim() === '')) {
            addError(rowNum, 'A coluna Conta Contábil está vazia.', row)
            continue
          }

          const strCentroCusto = String(centroCusto || '')
            .trim()
            .toUpperCase()
          const strContaContabil = String(contaContabil || '')
            .trim()
            .toUpperCase()

          const ccId = ccMap.get(strCentroCusto)
          if (!ccId && !allowIncomplete) {
            addError(rowNum, `Centro de Custo "${strCentroCusto}" não encontrado.`, row)
            continue
          }

          const caId = caMap.get(strContaContabil)
          if (!caId && !allowIncomplete) {
            addError(rowNum, `Conta Contábil "${strContaContabil}" não encontrada.`, row)
            continue
          }

          if (ccId && caId) {
            if (processedCCIds.has(ccId)) {
              addError(rowNum, `Centro de custo "${strCentroCusto}" duplicado na planilha.`, row)
              continue
            }
            processedCCIds.add(ccId)

            const existing = existingMappingsByCC.get(ccId)
            if (existing) {
              if (mode === 'INSERT_ONLY') {
                addError(
                  rowNum,
                  `O mapeamento para o centro de custo "${strCentroCusto}" já existe.`,
                  row,
                )
                continue
              } else {
                toUpdate.push({
                  id: existing.id,
                  organization_id: orgId,
                  cost_center_id: ccId,
                  chart_account_id: caId,
                  mapping_type: String(tipoMapeamento || 'DE/PARA'),
                  _rowNum: rowNum,
                })
              }
            } else {
              toInsert.push({
                organization_id: orgId,
                cost_center_id: ccId,
                chart_account_id: caId,
                mapping_type: String(tipoMapeamento || 'DE/PARA'),
                _rowNum: rowNum,
              })
            }
          } else if (ccId || caId) {
            toInsert.push({
              organization_id: orgId,
              cost_center_id: ccId || null,
              chart_account_id: caId || null,
              mapping_type: String(tipoMapeamento || 'DE/PARA'),
              _rowNum: rowNum,
            })
          }
        }

        let toDeleteIds: string[] = []
        if (mode === 'REPLACE') {
          toDeleteIds = existingMappings
            .filter((m: any) => m.cost_center_id && !processedCCIds.has(m.cost_center_id))
            .map((m: any) => m.id)
        }

        if (toDeleteIds.length > 0) {
          for (let i = 0; i < toDeleteIds.length; i += 100) {
            await supabaseAdmin
              .from('account_mapping')
              .delete()
              .in('id', toDeleteIds.slice(i, i + 100))
          }
        }

        for (let i = 0; i < toInsert.length; i += 100) {
          const chunk = toInsert.slice(i, i + 100)
          const dbChunk = chunk.map((c: any) => {
            const { _rowNum, ...rest } = c
            return rest
          })
          const { error: insErr } = await supabaseAdmin.from('account_mapping').insert(dbChunk)
          if (insErr) {
            console.error(`[MAPPINGS] Insert error:`, insErr)
            chunk.forEach((c: any) => {
              addError(c._rowNum, `Erro na inserção: ${insErr.message}`, c)
            })
          } else {
            inserted += chunk.length
          }
        }

        for (let i = 0; i < toUpdate.length; i += 100) {
          const chunk = toUpdate.slice(i, i + 100)
          const dbChunk = chunk.map((c: any) => {
            const { _rowNum, ...rest } = c
            return rest
          })
          const { error: updErr } = await supabaseAdmin.from('account_mapping').upsert(dbChunk)
          if (updErr) {
            console.error(`[MAPPINGS] Upsert error:`, updErr)
            chunk.forEach((c: any) => {
              addError(c._rowNum, `Erro na atualização: ${updErr.message}`, c)
            })
          } else {
            inserted += chunk.length
          }
        }
      }
    } else if (type === 'FINANCIAL_ENTRIES') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }

      const recordsByOrg = new Map<string, any[]>()

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = row._originalIndex || (payload.offset || 0) + i + 1
        const getVal = createRowAccessor(row)

        const empresa = getVal(['EMPRESA'])
        let orgId = organizationId

        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }
          orgId = await resolveOrganization(empresa)
          if (!orgId && empresa) {
            addError(rowNum, `Erro ao resolver ou criar a empresa "${empresa}". (Obrigatório)`, row)
            continue
          }
        }

        if (!recordsByOrg.has(orgId)) recordsByOrg.set(orgId, [])
        recordsByOrg.get(orgId)!.push({ row, rowNum, getVal })
      }

      for (const [orgId, orgRecords] of recordsByOrg.entries()) {
        if (!orgId) continue

        let existingCCs: any[] = []
        let fetchHasMore = true
        let fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: errCC } = await supabase
            .from('cost_centers')
            .select('id, code')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (errCC) throw new Error(`Erro ao buscar centros de custo: ${errCC.message}`)
          if (pageData && pageData.length > 0) {
            existingCCs.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }
        const ccMap = new Map<string, string>()
        existingCCs.forEach((cc) => {
          if (cc.code) ccMap.set(cc.code.trim().toUpperCase(), cc.id)
        })

        let existingCAs: any[] = []
        fetchHasMore = true
        fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: errCA } = await supabase
            .from('chart_of_accounts')
            .select('id, account_code')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (errCA) throw new Error(`Erro ao buscar contas contábeis: ${errCA.message}`)
          if (pageData && pageData.length > 0) {
            existingCAs.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }
        const caMap = new Map<string, string>()
        existingCAs.forEach((ca) => {
          if (ca.account_code) caMap.set(ca.account_code.trim().toUpperCase(), ca.id)
        })

        const datesToFetch = new Set<string>()
        for (const item of orgRecords) {
          const { row, getVal } = item
          const data = getVal(['DATA'])
          let parsedDate = safeParseDate(data)
          if (parsedDate) {
            datesToFetch.add(parsedDate)
          }
        }

        const existingFMs = new Set<string>()
        if (datesToFetch.size > 0) {
          const dateArray = Array.from(datesToFetch)
          for (let i = 0; i < dateArray.length; i += 100) {
            const chunkDates = dateArray.slice(i, i + 100)
            let fmPage = 0
            let fmHasMore = true
            while (fmHasMore) {
              const { data: fmData, error: errFM } = await supabase
                .from('financial_movements')
                .select('id, movement_date, amount, cost_center_id')
                .eq('organization_id', orgId)
                .in('movement_date', chunkDates)
                .range(fmPage * 1000, (fmPage + 1) * 1000 - 1)

              if (errFM) throw new Error(`Erro ao buscar movimentos existentes: ${errFM.message}`)
              if (fmData && fmData.length > 0) {
                fmData.forEach((fm) => {
                  existingFMs.add(`${fm.movement_date}|${fm.amount}|${fm.cost_center_id || 'null'}`)
                })
                fmPage++
                if (fmData.length < 1000) fmHasMore = false
              } else {
                fmHasMore = false
              }
            }
          }
        }

        const toInsertFM: any[] = []
        const toInsertAE: any[] = []

        for (const item of orgRecords) {
          const { row, rowNum, getVal } = item

          const data = getVal(['DATA'])
          const descricao = getVal(['DESCRICAO', 'HISTORICO'])
          const valorRaw = getVal(['VALOR'])
          const centroCusto = getVal(['CENTROCUSTO'])
          const contaDebito = getVal(['CONTADEBITO', 'DEBITO'])
          const contaCredito = getVal(['CONTACREDITO', 'CREDITO'])

          if (!allowIncomplete && (!data || String(data).trim() === '')) {
            addError(rowNum, 'A coluna Data está vazia.', row)
            continue
          }

          let formattedDate = safeParseDate(data)
          if (!formattedDate) {
            if (!allowIncomplete) {
              addError(rowNum, 'A coluna DATA possui formato inválido ou ano fora do limite.', row)
              continue
            }
            formattedDate = new Date().toISOString().split('T')[0]
          }

          let valor = safeParseNum(valorRaw)
          if (valor === null) {
            if (!allowIncomplete) {
              addError(rowNum, 'A coluna VALOR possui formato numérico inválido.', row)
              continue
            }
            valor = 0
          }

          const strCentroCusto = String(centroCusto || '')
            .trim()
            .toUpperCase()
          let ccId = strCentroCusto ? ccMap.get(strCentroCusto) : null

          if (!ccId && strCentroCusto !== '') {
            const newCcId = crypto.randomUUID()
            const { error: insErr } = await supabaseAdmin.from('cost_centers').insert({
              id: newCcId,
              organization_id: orgId,
              code: strCentroCusto,
              description: strCentroCusto,
            })
            if (!insErr) {
              ccId = newCcId
              ccMap.set(strCentroCusto, newCcId)
            } else if (!allowIncomplete) {
              addError(
                rowNum,
                `Centro de Custo "${strCentroCusto}" não encontrado e erro ao criar.`,
                row,
              )
              continue
            }
          }

          const strContaDebito = String(contaDebito || '')
            .trim()
            .toUpperCase()
          let debitId = strContaDebito ? caMap.get(strContaDebito) : null

          if (!debitId && strContaDebito !== '') {
            const newAccId = crypto.randomUUID()
            const { error: insErr } = await supabaseAdmin.from('chart_of_accounts').insert({
              id: newAccId,
              organization_id: orgId,
              account_code: strContaDebito,
              account_name: strContaDebito,
              classification: strContaDebito,
            })
            if (!insErr) {
              debitId = newAccId
              caMap.set(strContaDebito, newAccId)
            } else if (!allowIncomplete) {
              addError(
                rowNum,
                `Conta Débito "${strContaDebito}" não encontrada e erro ao criar.`,
                row,
              )
              continue
            }
          }

          const strContaCredito = String(contaCredito || '')
            .trim()
            .toUpperCase()
          let creditId = strContaCredito ? caMap.get(strContaCredito) : null

          if (!creditId && strContaCredito !== '') {
            const newAccId = crypto.randomUUID()
            const { error: insErr } = await supabaseAdmin.from('chart_of_accounts').insert({
              id: newAccId,
              organization_id: orgId,
              account_code: strContaCredito,
              account_name: strContaCredito,
              classification: strContaCredito,
            })
            if (!insErr) {
              creditId = newAccId
              caMap.set(strContaCredito, newAccId)
            } else if (!allowIncomplete) {
              addError(
                rowNum,
                `Conta Crédito "${strContaCredito}" não encontrada e erro ao criar.`,
                row,
              )
              continue
            }
          }

          const amt = valor
          const fmKey = `${formattedDate}|${amt}|${ccId || 'null'}`

          if (existingFMs.has(fmKey)) {
            addError(rowNum, `Lançamento já existe com mesma data, valor e centro de custo.`, row)
            continue
          }

          const fmId = crypto.randomUUID()

          toInsertFM.push({
            id: fmId,
            organization_id: orgId,
            movement_date: formattedDate,
            amount: amt,
            description: String(descricao || ''),
            cost_center_id: ccId || null,
            status: 'Concluído',
            _rowNum: rowNum,
          })

          toInsertAE.push({
            organization_id: orgId,
            entry_date: formattedDate,
            amount: amt,
            description: String(descricao || ''),
            debit_account_id: debitId || null,
            credit_account_id: creditId || null,
            status: 'Concluído',
            _rowNum: rowNum,
          })

          existingFMs.add(fmKey)
        }

        for (let i = 0; i < toInsertFM.length; i += 100) {
          const chunkFM = toInsertFM.slice(i, i + 100)
          const chunkAE = toInsertAE.slice(i, i + 100)

          const dbChunkFM = chunkFM.map((c) => {
            const { _rowNum, ...rest } = c
            return rest
          })
          const dbChunkAE = chunkAE.map((c) => {
            const { _rowNum, ...rest } = c
            return rest
          })

          const { error: fmErr } = await supabaseAdmin.from('financial_movements').insert(dbChunkFM)
          if (fmErr) {
            console.error(`[FINANCIAL_ENTRIES] Insert FM error:`, fmErr)
            chunkFM.forEach((c: any) => {
              addError(c._rowNum, `Erro na inserção de movimento: ${fmErr.message}`, c)
            })
            continue
          }

          const { error: aeErr } = await supabaseAdmin.from('accounting_entries').insert(dbChunkAE)
          if (aeErr) {
            console.error(`[FINANCIAL_ENTRIES] Insert AE error:`, aeErr)
            chunkAE.forEach((c: any) => {
              addError(c._rowNum, `Erro na inserção contábil: ${aeErr.message}`, c)
            })
          } else {
            inserted += chunkFM.length
          }
        }
      }
    } else if (type === 'ERP_FINANCIAL_MOVEMENTS') {
      let orgId = organizationId
      if (!orgId && orgs && orgs.length > 0) {
        orgId = orgs[0].id
      }
      if (!orgId) {
        throw new Error('Nenhuma empresa associada ao usuário para realizar a importação.')
      }

      const rpcPayload = {
        p_org_id: orgId,
        p_import_id: payload.importId || null,
        p_records: records,
      }

      const { data: res, error: rpcErr } = await supabaseAdmin.rpc(
        'import_erp_movements_batch',
        rpcPayload,
      )
      if (rpcErr) {
        addError(0, `Erro RPC: ${rpcErr.message}`, {})
      } else if (res && res.success === false) {
        addError(0, `Erro RPC: ${res.error}`, {})
      } else {
        inserted += records.length
      }
    }

    if (payload.action === 'PROCESS_CHUNK') {
      const newInserted = (payload.inserted || 0) + inserted
      const newRejected = (payload.rejected || 0) + rejected
      const newErrors = [...(payload.errors || []), ...errors].slice(0, 100)

      const nextChunk = payload.chunkIndex + 1
      const isDone = nextChunk >= payload.totalChunks

      await supabaseAdmin
        .from('import_history')
        .update({
          processed_records: Math.min(nextChunk * 2000, payload.totalRecords || nextChunk * 2000),
          success_count: newInserted,
          error_count: newRejected,
          errors_list: newErrors,
          status: isDone ? 'Completed' : 'Processing',
        })
        .eq('id', payload.importId)

      if (!isDone) {
        EdgeRuntime.waitUntil(
          (async () => {
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/import-data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  ...payload,
                  chunkIndex: nextChunk,
                  inserted: newInserted,
                  rejected: newRejected,
                  errors: newErrors,
                }),
              })
            } catch (e) {}
          })(),
        )
      } else {
        EdgeRuntime.waitUntil(
          (async () => {
            for (let i = 0; i < payload.totalChunks; i++) {
              await supabaseAdmin.storage
                .from('imports')
                .remove([`${payload.importId}/chunk_${i}.json`])
            }
          })(),
        )
      }

      return new Response(JSON.stringify({ success: true, isDone }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payload.action === 'PROCESS_BACKGROUND') {
      const newInserted = (payload.inserted || 0) + inserted
      const newRejected = (payload.rejected || 0) + rejected
      const newErrors = [...(payload.errors || []), ...errors].slice(0, 100)
      const nextOffset = (payload.offset || 0) + (payload.limit || 100)
      const rawTotalRecords =
        payload.actualTotalRecords ||
        (typeof payload.totalRecords === 'number'
          ? payload.totalRecords
          : payload.fileBase64 || payload.filePath
            ? records.length + (payload.offset || 0)
            : records.length)

      const isDone = nextOffset >= rawTotalRecords || records.length === 0

      await supabaseAdmin
        .from('import_history')
        .update({
          processed_records: Math.min(nextOffset, rawTotalRecords),
          total_records: rawTotalRecords,
          success_count: newInserted,
          error_count: newRejected,
          errors_list: newErrors,
          status: isDone ? 'Completed' : 'Processing',
        })
        .eq('id', payload.importId)

      if (!isDone && records.length > 0) {
        EdgeRuntime.waitUntil(
          (async () => {
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/import-data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  ...payload,
                  offset: nextOffset,
                  inserted: newInserted,
                  rejected: newRejected,
                  errors: newErrors,
                }),
              })
            } catch (e) {
              console.error('Error triggering next background chunk:', e)
            }
          })(),
        )
      }

      return new Response(JSON.stringify({ success: true, isDone }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!payload.skipHistory) {
      await supabase.from('import_history').insert({
        user_id: user.id,
        import_type: type,
        file_name: fileName || 'Importação via CSV',
        total_records:
          typeof payload.totalRecords === 'number' ? payload.totalRecords : records.length,
        success_count: inserted,
        error_count: rejected,
        status: 'Completed',
      })
    }

    return new Response(JSON.stringify({ inserted, rejected, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    if (req.method === 'POST') {
      try {
        const reqClone = req.clone()
        const payload = await reqClone.json().catch(() => ({}))
        if (payload.action === 'PROCESS_BACKGROUND' && payload.importId) {
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, supabaseServiceKey!)
          await supabaseAdmin
            .from('import_history')
            .update({
              status: 'Error',
              errors_list: [{ error: err.message }],
            })
            .eq('id', payload.importId)
        }
      } catch (e) {}
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
