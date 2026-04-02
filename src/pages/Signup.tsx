import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Wallet, Loader2, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function Signup() {
  const { signUp, user, loading: authLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organization, setOrganization] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  if (authLoading) return null
  if (user) return <Navigate to="/" replace />

  const isValidCPF = (val: string) => {
    const c = val.replace(/[^\d]+/g, '')
    if (c === '' || c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
    let sum = 0,
      rem
    for (let i = 1; i <= 9; i++) sum += parseInt(c.substring(i - 1, i)) * (11 - i)
    rem = (sum * 10) % 11
    if (rem === 10 || rem === 11) rem = 0
    if (rem !== parseInt(c.substring(9, 10))) return false
    sum = 0
    for (let i = 1; i <= 10; i++) sum += parseInt(c.substring(i - 1, i)) * (12 - i)
    rem = (sum * 10) % 11
    if (rem === 10 || rem === 11) rem = 0
    if (rem !== parseInt(c.substring(10, 11))) return false
    return true
  }

  const isLengthValid = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isPasswordValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumber
  const isMatch = password === confirmPassword && password.length > 0
  const isFormValid =
    isPasswordValid &&
    isMatch &&
    name.trim().length > 0 &&
    organization.length > 0 &&
    isValidCPF(cpf)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      toast({
        title: 'Dados inválidos',
        description: 'Por favor, preencha todos os campos corretamente.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // Check if CPF is already registered
    const { data: existingCpf } = await supabase
      .from('cadastro_usuarios')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle()

    if (existingCpf) {
      toast({
        title: 'Erro ao criar conta',
        description: 'Este CPF já está cadastrado no sistema.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, {
      name,
      organization,
      cpf,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message.includes('CPF_DUPLICATE')
          ? 'Este CPF já está cadastrado no sistema.'
          : error.message,
        variant: 'destructive',
      })
    } else {
      // Find admin to send email to
      const { data: adminData } = await supabase
        .from('cadastro_usuarios')
        .select('email')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle()

      const adminEmail = adminData?.email || 'admin@seudominio.com'

      await supabase.functions.invoke('send-email', {
        body: {
          to: adminEmail,
          subject: 'Novo Cadastro Pendente',
          body: `O usuário ${name} (${email}) se cadastrou e aguarda sua aprovação na Central de Aprovações.`,
        },
      })

      toast({
        title: 'Cadastro recebido!',
        description:
          'Sua conta foi criada e está aguardando aprovação do administrador. Você receberá um aviso quando for liberado.',
      })
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg mb-4">
            <Wallet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar Nova Conta</h1>
          <p className="text-slate-500 mt-2">Registre-se para gerenciar sua organização.</p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <form onSubmit={handleSignup}>
            <CardHeader>
              <CardTitle>Cadastro</CardTitle>
              <CardDescription>Preencha os dados abaixo para criar seu acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organização</Label>
                <Select value={organization} onValueChange={setOrganization} required>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOMA PARTS">NOMA PARTS</SelectItem>
                    <SelectItem value="LS ALMEIDA">LS ALMEIDA</SelectItem>
                    <SelectItem value="NOMA SERVICE">NOMA SERVICE</SelectItem>
                    <SelectItem value="PF">PF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Password strength indicator */}
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2 border border-slate-100">
                <p className="font-medium text-slate-700">Requisitos da senha:</p>
                <ul className="space-y-1">
                  <li
                    className={cn(
                      'flex items-center gap-2',
                      isLengthValid ? 'text-green-600' : 'text-slate-500',
                    )}
                  >
                    {isLengthValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Mínimo de 8 caracteres
                  </li>
                  <li
                    className={cn(
                      'flex items-center gap-2',
                      hasUpperCase ? 'text-green-600' : 'text-slate-500',
                    )}
                  >
                    {hasUpperCase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Pelo menos uma letra maiúscula
                  </li>
                  <li
                    className={cn(
                      'flex items-center gap-2',
                      hasLowerCase ? 'text-green-600' : 'text-slate-500',
                    )}
                  >
                    {hasLowerCase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Pelo menos uma letra minúscula
                  </li>
                  <li
                    className={cn(
                      'flex items-center gap-2',
                      hasNumber ? 'text-green-600' : 'text-slate-500',
                    )}
                  >
                    {hasNumber ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    Pelo menos um número
                  </li>
                  <li
                    className={cn(
                      'flex items-center gap-2',
                      confirmPassword
                        ? isMatch
                          ? 'text-green-600'
                          : 'text-red-500'
                        : 'text-slate-500',
                    )}
                  >
                    {confirmPassword && isMatch ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Senhas conferem
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !isFormValid}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Conta
              </Button>
              <p className="text-sm text-center text-slate-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
