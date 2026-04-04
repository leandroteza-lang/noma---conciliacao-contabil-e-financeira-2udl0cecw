import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Trash2,
  Edit3,
  UserPlus,
  Shield,
  Building2,
  Activity,
  Users as UsersIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Camera,
  Loader2,
  Clock,
  FileDown,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  FileUp,
  UploadCloud,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import * as XLSX from 'xlsx'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [batchEditOpen, setBatchEditOpen] = useState(false)
  const [batchField, setBatchField] = useState<string>('')
  const [batchValue, setBatchValue] = useState<string>('')
  const [batchLoading, setBatchLoading] = useState(false)

  // Import modal
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    inserted: number
    rejected: number
    errors: any[]
  } | null>(null)

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        NOME: 'João Silva',
        EMAIL: 'joao.silva@empresa.com',
        CPF: '111.222.333-44',
        TELEFONE: '(11) 99999-9999',
        DEPARTAMENTO_CODIGO: 'DEP-123',
        PERFIL: 'collaborator',
        ENDERECO: 'Rua Fictícia, 123',
        OBSERVACOES: 'Usuário importado',
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Usuários')
    XLSX.writeFile(wb, 'modelo_importacao_usuarios.xlsx')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImportFile(file)
    setImportResult(null)
    if (!file) {
      setImportPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const cpfsToFetch = jsonData
          .map((r: any) => {
            const rawCpf = String(r['CPF'] || '').trim()
            const digits = rawCpf.replace(/\D/g, '')
            if (digits.length === 11) {
              return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            }
            return rawCpf
          })
          .filter(Boolean)

        const emailsToFetch = jsonData
          .map((r: any) => String(r['EMAIL'] || '').trim())
          .filter(Boolean)

        let uniqueMatches: any[] = []

        if (cpfsToFetch.length > 0 || emailsToFetch.length > 0) {
          const [cpfRes, emailRes] = await Promise.all([
            cpfsToFetch.length > 0
              ? supabase
                  .from('cadastro_usuarios')
                  .select(
                    'id, user_id, email, cpf, approval_status, pending_deletion, status, deleted_at',
                  )
                  .in('cpf', cpfsToFetch)
              : Promise.resolve({ data: [] }),
            emailsToFetch.length > 0
              ? supabase
                  .from('cadastro_usuarios')
                  .select(
                    'id, user_id, email, cpf, approval_status, pending_deletion, status, deleted_at',
                  )
                  .in('email', emailsToFetch)
              : Promise.resolve({ data: [] }),
          ])

          const allMatches = [...(cpfRes.data || []), ...(emailRes.data || [])]
          uniqueMatches = Array.from(new Map(allMatches.map((item) => [item.id, item])).values())
        }

        const previewData = jsonData.map((row: any, index: number) => {
          const errors: string[] = []
          const nome = row['NOME']
          if (!nome || String(nome).trim() === '') errors.push('Nome vazio')

          const email = String(row['EMAIL'] || '').trim()
          if (!email) errors.push('E-mail vazio')

          const rawCpf = String(row['CPF'] || '').trim()
          const digits = rawCpf.replace(/\D/g, '')
          let formattedCpf = rawCpf
          if (digits.length === 11) {
            formattedCpf = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          }

          const match = uniqueMatches.find(
            (m) => m.email === email || (formattedCpf && m.cpf === formattedCpf),
          )

          let status = 'new'
          let action = 'insert'
          let existingId = null
          let userId = null

          if (match) {
            existingId = match.id
            userId = match.user_id

            if (match.pending_deletion) {
              status = 'pending_deletion'
              action = 'restore'
            } else if (match.deleted_at || match.approval_status === 'pending') {
              status = 'pending_approval'
              action = 'approve'
            } else {
              status = 'active'
              action = 'error'
              if (match.email === email) errors.push('E-mail já cadastrado (Ativo)')
              if (formattedCpf && match.cpf === formattedCpf)
                errors.push('CPF já cadastrado (Ativo)')
            }
          }

          return {
            _original: row,
            _rowNum: index + 1,
            _nome: nome,
            _email: email,
            _cpf: formattedCpf,
            _perfil: row['PERFIL'] || 'collaborator',
            _departamento: row['DEPARTAMENTO_CODIGO'] || '-',
            _status: status,
            _action: action,
            _existingId: existingId,
            _userId: userId,
            _errors: errors,
          }
        })

        setImportPreview(previewData)
      } catch (error) {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Formato de planilha inválido',
          variant: 'destructive',
        })
        setImportFile(null)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const updatePreviewAction = (index: number, newAction: string) => {
    setImportPreview((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], _action: newAction }
      return next
    })
  }

  const processImport = async () => {
    if (!importFile || !importPreview) return
    setImportLoading(true)
    setImportResult(null)

    try {
      const validRecords = importPreview.filter(
        (p) => p._errors.length === 0 && p._action !== 'discard' && p._action !== 'error',
      )

      if (validRecords.length === 0) {
        toast({
          title: 'Atenção',
          description: 'Nenhum registro válido ou selecionado para importar.',
          variant: 'destructive',
        })
        setImportLoading(false)
        return
      }

      const payloadRecords = validRecords.map((p) => ({
        ...p._original,
        _action: p._action,
        _existingId: p._existingId,
        _userId: p._userId,
      }))

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            type: 'EMPLOYEES',
            records: payloadRecords,
            fileName: importFile.name,
            allowIncomplete: false,
          }),
        },
      )

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro na importação')

      setImportResult(result)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setImportLoading(false)
    }
  }

  // User form modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [cpfError, setCpfError] = useState<string>('')
  const [isCheckingCpf, setIsCheckingCpf] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'collaborator',
    department_id: 'none',
    status: true,
    address: '',
    observations: '',
    permissions: ['all'] as string[],
    companies: [] as string[],
    avatar_url: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, deptsRes, orgsRes] = await Promise.all([
      supabase
        .from('cadastro_usuarios')
        .select('*, departments(name), cadastro_usuarios_companies(organization_id)')
        .is('deleted_at', null)
        .order('name'),
      supabase.from('departments').select('*').is('deleted_at', null).order('name'),
      supabase.from('organizations').select('*').is('deleted_at', null).order('name'),
    ])
    if (usersRes.data) setUsers(usersRes.data)
    if (deptsRes.data) setDepartments(deptsRes.data)
    if (orgsRes.data) setOrganizations(orgsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 w-4 h-4 opacity-50" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-2 w-4 h-4" />
    ) : (
      <ArrowDown className="ml-2 w-4 h-4" />
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig

    let aValue = a[key]
    let bValue = b[key]

    if (key === 'department') {
      aValue = a.departments?.name || ''
      bValue = b.departments?.name || ''
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(sortedUsers.map((u) => u.id))
    else setSelected([])
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelected((prev) => [...prev, id])
    else setSelected((prev) => prev.filter((x) => x !== id))
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    setAvatarFile(null)
    setAvatarPreview('')
    setCpfError('')
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'collaborator',
      department_id: 'none',
      status: true,
      address: '',
      observations: '',
      permissions: ['all'],
      companies: [],
      avatar_url: '',
    })
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (user: any) => {
    setEditingUser(user)
    setAvatarFile(null)
    setAvatarPreview(user.avatar_url || '')
    setCpfError('')
    setFormData({
      name: user.name || '',
      email: user.email || '',
      cpf: user.cpf || '',
      phone: user.phone || '',
      role: user.role || 'collaborator',
      department_id: user.department_id || 'none',
      status: user.status ?? true,
      address: user.address || '',
      observations: user.observations || '',
      permissions: user.permissions || ['all'],
      companies: user.cadastro_usuarios_companies?.map((c: any) => c.organization_id) || [],
      avatar_url: user.avatar_url || '',
    })
    setIsUserModalOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '')
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
    const cpfDigits = cpf.split('').map((el) => +el)
    const rest = (count: number) =>
      ((cpfDigits.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) *
        10) %
        11) %
      10
    return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10]
  }

  useEffect(() => {
    let isMounted = true
    const checkCpfUniqueness = async () => {
      if (formData.cpf.length === 14) {
        if (!validateCPF(formData.cpf)) {
          if (isMounted) setCpfError('CPF inválido')
          return
        }

        if (isMounted) {
          setIsCheckingCpf(true)
          setCpfError('')
        }

        let query = supabase
          .from('cadastro_usuarios')
          .select('id')
          .eq('cpf', formData.cpf)
          .is('deleted_at', null)

        if (editingUser?.id) {
          query = query.neq('id', editingUser.id)
        }

        const { data, error } = await query.maybeSingle()

        if (isMounted) {
          setIsCheckingCpf(false)
          if (error) {
            console.error('Erro ao verificar CPF:', error)
          } else if (data) {
            setCpfError('CPF já cadastrado no sistema')
          } else {
            setCpfError('')
          }
        }
      } else {
        if (isMounted) setCpfError('')
      }
    }

    const timeoutId = setTimeout(() => {
      checkCpfUniqueness()
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [formData.cpf, editingUser])

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.cpf || formData.cpf.length < 14) {
      toast({
        title: 'Atenção',
        description: 'Nome, E-mail e CPF válido são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (cpfError || isCheckingCpf) {
      toast({
        title: 'Atenção',
        description: cpfError || 'Aguarde a verificação do CPF.',
        variant: 'destructive',
      })
      return
    }

    if (formData.cpf && formData.cpf.trim() !== '') {
      if (!validateCPF(formData.cpf)) {
        toast({
          title: 'Atenção',
          description: 'O CPF informado é inválido.',
          variant: 'destructive',
        })
        return
      }
    }

    setBatchLoading(true)

    let uploadedAvatarUrl = formData.avatar_url
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) {
        toast({
          title: 'Erro',
          description: 'Erro ao fazer upload da foto de perfil.',
          variant: 'destructive',
        })
        setBatchLoading(false)
        return
      }
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      uploadedAvatarUrl = publicUrlData.publicUrl
    }

    if (editingUser) {
      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({
          name: formData.name,
          cpf: formData.cpf || null,
          phone: formData.phone || null,
          role: formData.role,
          department_id: formData.department_id === 'none' ? null : formData.department_id,
          status: formData.status,
          address: formData.address || null,
          observations: formData.observations || null,
          permissions: formData.permissions.length > 0 ? formData.permissions : ['all'],
          avatar_url: uploadedAvatarUrl || null,
        })
        .eq('id', editingUser.id)

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
      } else {
        await supabase.from('cadastro_usuarios_companies').delete().eq('usuario_id', editingUser.id)

        if (formData.companies.length > 0) {
          const inserts = formData.companies.map((orgId) => ({
            usuario_id: editingUser.id,
            organization_id: orgId,
          }))
          await supabase.from('cadastro_usuarios_companies').insert(inserts)
        }

        toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso.' })
        setIsUserModalOpen(false)
        fetchData()
      }
    } else {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'invite',
            email: formData.email,
            name: formData.name,
            role: formData.role,
            cpf: formData.cpf,
            phone: formData.phone,
            department_id: formData.department_id === 'none' ? null : formData.department_id,
            admin_id: session?.user?.id,
            address: formData.address,
            observations: formData.observations,
            permissions: formData.permissions.length > 0 ? formData.permissions : ['all'],
            companies: formData.companies,
            avatar_url: uploadedAvatarUrl,
          }),
        })

        const result = await res.json()

        if (!result.success) {
          toast({
            title: 'Erro ao convidar',
            description: result.error || 'Falha ao convidar usuário',
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Sucesso', description: 'Convite enviado com sucesso.' })
          setIsUserModalOpen(false)
          fetchData()
        }
      } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      }
    }

    setBatchLoading(false)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return

    const { error } = await supabase
      .from('cadastro_usuarios')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Usuário excluído com sucesso.' })
      fetchData()
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Deseja realmente excluir ${selected.length} usuários?`)) return

    const { error } = await supabase
      .from('cadastro_usuarios')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', selected)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: `${selected.length} usuários excluídos em lote.` })
      setSelected([])
      fetchData()
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'txt') => {
    if (sortedUsers.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      })
      return
    }

    const dataToExport = sortedUsers.map((u) => ({
      name: u.name,
      email: u.email,
      cpf: u.cpf,
      phone: u.phone,
      address: u.address,
      department: u.departments?.name,
      role: u.role,
      status: u.status,
      approval_status: u.approval_status,
      created_at: new Date(u.created_at).toLocaleDateString('pt-BR'),
    }))

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ format, data: dataToExport }),
      })

      if (!res.ok) {
        let errMessage = 'Falha ao exportar'
        try {
          const errData = await res.json()
          if (errData && errData.error) errMessage = errData.error
        } catch (e) {
          // ignore
        }
        throw new Error(errMessage)
      }
      const result = await res.json()

      if (format === 'excel' && result.excel) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.excel}`
        link.download = `usuarios_${new Date().getTime()}.xlsx`
        link.click()
      } else if (format === 'pdf' && result.pdf) {
        const link = document.createElement('a')
        link.href = result.pdf
        link.download = `usuarios_${new Date().getTime()}.pdf`
        link.click()
      } else if (format === 'csv' && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `usuarios_${new Date().getTime()}.csv`
        link.click()
      } else if (format === 'txt' && result.txt) {
        const blob = new Blob([result.txt], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `usuarios_${new Date().getTime()}.txt`
        link.click()
      } else {
        throw new Error('Formato não retornado ou erro na exportação')
      }
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    }
  }

  const PERMISSIONS_LIST = [
    { id: 'view_dashboard', label: 'Dashboard' },
    { id: 'view_companies', label: 'Empresas' },
    { id: 'view_departments', label: 'Departamentos' },
    { id: 'view_users', label: 'Usuários' },
    { id: 'view_chart_accounts', label: 'Plano de Contas' },
    { id: 'view_cost_centers', label: 'Centros de Custo' },
    { id: 'view_bank_accounts', label: 'Contas Bancárias' },
    { id: 'view_mappings', label: 'Mapeamentos' },
    { id: 'view_entries', label: 'Lançamentos' },
    { id: 'view_analysis', label: 'Análises' },
    { id: 'view_tga_accounts', label: 'Tipos de Conta TGA' },
  ]

  const handleBatchEdit = async () => {
    if (!batchField || !batchValue) return
    setBatchLoading(true)

    let updateData: any = {}
    if (batchField === 'role') updateData.role = batchValue
    if (batchField === 'department_id')
      updateData.department_id = batchValue === 'none' ? null : batchValue
    if (batchField === 'status') updateData.status = batchValue === 'true'

    const { error } = await supabase.from('cadastro_usuarios').update(updateData).in('id', selected)

    setBatchLoading(false)
    if (error) {
      toast({ title: 'Erro na atualização', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Sucesso',
        description: `${selected.length} usuários atualizados com sucesso.`,
      })
      setBatchEditOpen(false)
      setSelected([])
      fetchData()
    }
  }

  const mandatoryFilledCount = [
    formData.name?.trim() !== '',
    formData.email?.trim() !== '',
    formData.cpf?.trim() !== '' && formData.cpf.length === 14,
  ].filter(Boolean).length

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary" />
            Usuários
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie os acessos, permissões e departamentos da sua equipe.
          </p>
        </div>
        <Button className="w-full md:w-auto shadow-sm" onClick={openNewUserModal}>
          <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-primary/10 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto h-auto md:h-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm border-none">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Exportar em PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
                Exportar em XLSX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Exportar em CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileIcon className="w-4 h-4 mr-2 text-slate-500" />
                Exportar em TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm border-none">
                <FileUp className="w-4 h-4 mr-2" />
                Importar em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Baixar Modelo (XLSX)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setImportResult(null)
                  setImportPreview(null)
                  setImportFile(null)
                  setImportModalOpen(true)
                }}
              >
                <UploadCloud className="w-4 h-4 mr-2 text-blue-600" />
                Importar Dados (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selected.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg">
                {selected.length} selecionado(s)
              </span>
              <Button
                variant="secondary"
                className="shadow-sm"
                onClick={() => {
                  setBatchField('')
                  setBatchValue('')
                  setBatchEditOpen(true)
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar em Lote
              </Button>
              <Button variant="destructive" className="shadow-sm" onClick={handleBatchDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir em Lote
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selected.length === sortedUsers.length && sortedUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Nome Completo <SortIcon columnKey="name" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  E-mail <SortIcon columnKey="email" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Perfil de Acesso <SortIcon columnKey="role" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center">
                  Departamento <SortIcon columnKey="department" />
                </div>
              </TableHead>
              <TableHead
                className="font-bold text-center cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  Status <SortIcon columnKey="status" />
                </div>
              </TableHead>
              <TableHead className="w-20 text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Carregando dados da equipe...
                </TableCell>
              </TableRow>
            ) : sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground font-medium"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={`group transition-colors ${selected.includes(user.id) ? 'bg-primary/5' : ''}`}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onCheckedChange={(c) => handleSelect(user.id, c as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        user.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-600'
                          : user.role === 'supervisor'
                            ? 'bg-blue-500/10 text-blue-600'
                            : user.role === 'client_user'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-slate-500/10 text-slate-600'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {user.role === 'admin'
                        ? 'Administrador'
                        : user.role === 'supervisor'
                          ? 'Supervisor'
                          : user.role === 'client_user'
                            ? 'Cliente'
                            : 'Colaborador'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {user.departments?.name || 'Não atribuído'}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.approval_status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-600">
                        <Clock className="w-3.5 h-3.5" />
                        Em Aprovação
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${user.status ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        {user.status ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditUserModal(user)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Form Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-md md:max-w-4xl h-[90vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize os dados do usuário abaixo.'
                : 'Preencha os dados para convidar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[80vh] px-6 py-4">
            <div className="bg-primary text-primary-foreground rounded-lg p-3 mb-6 font-semibold text-center shadow-sm">
              ✓ {mandatoryFilledCount} de 3 campos obrigatórios
            </div>

            <div className="flex justify-center mb-6 pt-2">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-muted shadow-sm">
                  <AvatarImage src={avatarPreview} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-muted/50">
                    {formData.name ? (
                      formData.name.charAt(0).toUpperCase()
                    ) : (
                      <UsersIcon className="w-8 h-8 opacity-50" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                >
                  <Camera className="w-6 h-6" />
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-1">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao@empresa.com"
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatCPF = (value: string) => {
                      return value
                        .replace(/\D/g, '')
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                        .replace(/(-\d{2})\d+?$/, '$1')
                    }
                    const formatted = formatCPF(e.target.value)
                    setFormData({ ...formData, cpf: formatted })
                  }}
                  placeholder="Ex: 000.000.000-00"
                  maxLength={14}
                  className={cpfError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {isCheckingCpf && (
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando CPF...
                  </p>
                )}
                {cpfError && !isCheckingCpf && (
                  <p className="text-xs text-red-500 font-medium">{cpfError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: (00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="collaborator">Colaborador</SelectItem>
                    <SelectItem value="client_user">Usuário Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(val) => setFormData({ ...formData, department_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Informações adicionais sobre o usuário..."
                  rows={2}
                />
              </div>

              <div className="space-y-3 md:col-span-2 mt-2">
                <Label className="text-base font-semibold">Acessos e Permissões</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-0 rounded-md border overflow-hidden shadow-sm">
                    <div className="bg-red-600 px-3 py-2">
                      <h3 className="text-white font-bold text-sm">Empresas Permitidas</h3>
                    </div>
                    <div className="bg-card p-1">
                      <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                        {organizations.length > 0 && (
                          <div className="flex items-start space-x-3 py-1 border-b border-border pb-2 mb-2">
                            <Checkbox
                              id="org-all"
                              checked={formData.companies.length === organizations.length}
                              onCheckedChange={(checked) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  companies: checked ? organizations.map((o) => o.id) : [],
                                }))
                              }}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor="org-all"
                              className="text-sm font-bold cursor-pointer leading-tight"
                            >
                              Acesso Total
                            </Label>
                          </div>
                        )}
                        {organizations.map((org) => (
                          <div key={org.id} className="flex items-start space-x-3 py-1">
                            <Checkbox
                              id={`org-${org.id}`}
                              checked={formData.companies.includes(org.id)}
                              onCheckedChange={(checked) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  companies: checked
                                    ? [...prev.companies, org.id]
                                    : prev.companies.filter((id) => id !== org.id),
                                }))
                              }}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={`org-${org.id}`}
                              className="text-sm font-normal cursor-pointer leading-tight"
                            >
                              {org.name}
                            </Label>
                          </div>
                        ))}
                        {organizations.length === 0 && (
                          <div className="text-sm text-muted-foreground py-4 text-center font-bold">
                            Nenhuma empresa cadastrada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0 rounded-md border overflow-hidden shadow-sm">
                    <div className="bg-red-600 px-3 py-2">
                      <h3 className="text-white font-bold text-sm">Permissões de Rotinas</h3>
                    </div>
                    <div className="bg-card p-1">
                      <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                        <div className="flex items-start space-x-3 py-1 border-b border-border pb-2 mb-2">
                          <Checkbox
                            id="perm-all"
                            checked={
                              formData.permissions.includes('all') ||
                              formData.permissions.length === PERMISSIONS_LIST.length
                            }
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                permissions: checked ? ['all'] : [],
                              }))
                            }}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor="perm-all"
                            className="text-sm font-bold cursor-pointer leading-tight"
                          >
                            Acesso Total
                          </Label>
                        </div>
                        {PERMISSIONS_LIST.map((perm) => {
                          const isAllSelected =
                            formData.permissions.includes('all') ||
                            formData.permissions.length === PERMISSIONS_LIST.length
                          const isChecked = isAllSelected || formData.permissions.includes(perm.id)

                          return (
                            <div key={perm.id} className="flex items-start space-x-3 py-1">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => {
                                    let currentPerms = prev.permissions.includes('all')
                                      ? PERMISSIONS_LIST.map((p) => p.id)
                                      : prev.permissions
                                    let newPerms = checked
                                      ? [...currentPerms, perm.id]
                                      : currentPerms.filter((p) => p !== perm.id)

                                    if (newPerms.length === PERMISSIONS_LIST.length) {
                                      newPerms = ['all']
                                    }
                                    return { ...prev, permissions: newPerms }
                                  })
                                }}
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`perm-${perm.id}`}
                                className="text-sm font-normal cursor-pointer leading-tight"
                              >
                                {perm.label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {editingUser && (
                <div className="space-y-2 md:col-span-2 mt-4">
                  <Label>Status da Conta</Label>
                  <Select
                    value={formData.status ? 'true' : 'false'}
                    onValueChange={(val) => setFormData({ ...formData, status: val === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo (Permitir acesso)</SelectItem>
                      <SelectItem value="false">Inativo (Bloquear acesso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-background p-4 flex gap-2 justify-end mt-auto z-10">
            <Button variant="ghost" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={batchLoading}>
              {batchLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog
        open={importModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setImportFile(null)
            setImportPreview(null)
            setImportResult(null)
          }
          setImportModalOpen(open)
        }}
      >
        <DialogContent
          className={cn(
            'flex flex-col h-[90vh] md:max-h-[90vh]',
            importPreview ? 'sm:max-w-5xl' : 'sm:max-w-md',
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              Importar Usuários em Lote
            </DialogTitle>
            <DialogDescription>
              Faça o upload do arquivo XLSX preenchido com base no modelo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-1">
            {!importPreview && !importResult ? (
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-primary hover:underline font-medium"
                  >
                    Clique para selecionar o arquivo
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {importFile && (
                    <p className="mt-4 text-sm text-center font-medium">
                      Arquivo: <span className="text-primary">{importFile.name}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : importPreview && !importResult ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Pré-visualização dos dados ({importPreview.length} registros)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportPreview(null)
                      setImportFile(null)
                    }}
                  >
                    Trocar Arquivo
                  </Button>
                </div>

                {importPreview.some(
                  (p) =>
                    p._errors.length > 0 ||
                    p._status === 'pending_approval' ||
                    p._status === 'pending_deletion',
                ) && (
                  <Alert className="py-2 px-3 h-auto">
                    <AlertTitle className="text-sm mb-1 font-bold">Atenção</AlertTitle>
                    <AlertDescription className="text-xs">
                      Revise a coluna de "Ação". Existem registros com pendências de exclusão ou de
                      aprovação. Você pode escolher importar/recuperar ou descartar esses usuários
                      específicos antes da importação.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border rounded-md shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-12 text-center">Linha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, i) => (
                        <TableRow
                          key={i}
                          className={
                            row._errors.length > 0 ? 'bg-red-50/50 hover:bg-red-50/80' : ''
                          }
                        >
                          <TableCell className="text-center font-medium">{row._rowNum}</TableCell>
                          <TableCell>{row._nome}</TableCell>
                          <TableCell>{row._email}</TableCell>
                          <TableCell>{row._cpf}</TableCell>
                          <TableCell>{row._departamento}</TableCell>
                          <TableCell>
                            {row._errors.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {row._errors.map((e: string, j: number) => (
                                  <span
                                    key={j}
                                    className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-md inline-block w-fit whitespace-nowrap"
                                  >
                                    {e}
                                  </span>
                                ))}
                              </div>
                            ) : row._status === 'pending_approval' ? (
                              <Select
                                value={row._action}
                                onValueChange={(val) => updatePreviewAction(i, val)}
                              >
                                <SelectTrigger
                                  className={cn(
                                    'h-8 text-xs w-[320px] font-semibold',
                                    row._action === 'approve'
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200',
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approve">
                                    Importar e Aprovar da Planilha de Importação
                                  </SelectItem>
                                  <SelectItem value="discard">Descartar (Ignorar)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : row._status === 'pending_deletion' ? (
                              <Select
                                value={row._action}
                                onValueChange={(val) => updatePreviewAction(i, val)}
                              >
                                <SelectTrigger
                                  className={cn(
                                    'h-8 text-xs w-[320px] font-semibold',
                                    row._action === 'restore'
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200',
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="restore">
                                    Importar e Reativar da Central de Aprovações
                                  </SelectItem>
                                  <SelectItem value="discard">Descartar (Ignorar)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-md whitespace-nowrap">
                                Inserir Novo
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="bg-muted/30 p-4 rounded-lg space-y-2 border">
                  <p className="font-semibold text-green-600 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> {importResult?.inserted} registros importados
                    com sucesso
                  </p>
                  {importResult?.rejected
                    ? importResult.rejected > 0 && (
                        <p className="font-semibold text-red-500 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> {importResult.rejected} registros com
                          erro ou duplicados
                        </p>
                      )
                    : null}
                </div>
                {importResult?.errors && importResult.errors.length > 0 && (
                  <ScrollArea className="h-40 border rounded-md p-3 bg-card text-sm">
                    {importResult.errors.map((err: any, i: number) => (
                      <div
                        key={i}
                        className="text-red-500 mb-2 border-b border-red-500/10 pb-2 last:border-0 last:mb-0 last:pb-0"
                      >
                        <strong className="font-bold">Linha {err.row}:</strong> {err.error}
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between pt-4 border-t mt-4">
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
              {importResult ? 'Fechar' : 'Cancelar'}
            </Button>
            {!importResult && importPreview && (
              <Button
                onClick={processImport}
                disabled={!importFile || importLoading}
                className="shadow-sm bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...
                  </>
                ) : (
                  'Confirmar Importação'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Edit Modal */}
      <Dialog open={batchEditOpen} onOpenChange={setBatchEditOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl">Edição em Lote</DialogTitle>
            <DialogDescription className="text-sm">
              Você está prestes a editar <strong>{selected.length}</strong> usuário(s)
              simultaneamente. Essa alteração será aplicada a todos.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="px-6 py-4 max-h-[70vh]">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Campo a ser alterado</Label>
                <Select
                  value={batchField}
                  onValueChange={(val) => {
                    setBatchField(val)
                    setBatchValue('')
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Escolha um campo para atualizar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Perfil de Acesso</SelectItem>
                    <SelectItem value="department_id">Departamento</SelectItem>
                    <SelectItem value="status">Status da Conta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {batchField === 'role' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Shield className="w-4 h-4 text-blue-500" /> Novo Perfil
                  </Label>
                  <Select value={batchValue} onValueChange={setBatchValue}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o novo perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="collaborator">Colaborador</SelectItem>
                      <SelectItem value="client_user">Usuário Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {batchField === 'department_id' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="w-4 h-4 text-purple-500" /> Novo Departamento
                  </Label>
                  <Select value={batchValue} onValueChange={setBatchValue}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Remover Departamento (Nenhum)</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {batchField === 'status' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Activity className="w-4 h-4 text-green-500" /> Novo Status
                  </Label>
                  <Select value={batchValue} onValueChange={setBatchValue}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo (Permitir acesso)</SelectItem>
                      <SelectItem value="false">Inativo (Bloquear acesso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 px-6 py-4 border-t sm:gap-0 bg-muted/20">
            <Button variant="ghost" onClick={() => setBatchEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBatchEdit}
              disabled={!batchField || !batchValue || batchLoading}
              className="shadow-sm"
            >
              {batchLoading ? 'Salvando...' : 'Aplicar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
