import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Wallet, Loader2, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  if (authLoading) return null
  if (user) return <Navigate to="/" replace />

  const isLengthValid = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isPasswordValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumber
  const isMatch = password === confirmPassword && password.length > 0

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      toast({
        title: 'Senha muito fraca',
        description: 'Por favor, siga os requisitos de senha.',
        variant: 'destructive',
      })
      return
    }

    if (!isMatch) {
      toast({
        title: 'Senhas não conferem',
        description: 'A confirmação de senha está diferente.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Conta criada!',
        description:
          'Verifique seu e-mail para confirmar a conta ou faça login se o auto-login estiver habilitado.',
      })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
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
                disabled={loading || !isPasswordValid || !isMatch}
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
