import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isStrongPassword } from '@/components/ChangePasswordModal'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsError(true)
        toast({
          title: 'Link inválido ou expirado',
          description: 'Por favor, solicite uma nova redefinição de senha.',
          variant: 'destructive',
        })
      }
    })
  }, [toast])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A senha e a confirmação de senha devem ser iguais.',
        variant: 'destructive',
      })
      return
    }

    if (!isStrongPassword(password)) {
      toast({
        title: 'Senha fraca',
        description:
          'A senha deve ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas, números e caracteres especiais.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast({
          title: 'Erro ao redefinir senha',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Senha redefinida com sucesso!',
          description: 'Sua senha foi atualizada. Redirecionando para o sistema...',
        })
        // Força o recarregamento via window.location para assegurar que a nova sessão e os estados globais do App sejam totalmente re-sincronizados, evitando tela branca
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err.message || 'Ocorreu um erro ao salvar a nova senha.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <Card className="border-slate-200 shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Link Inválido</h2>
            <p className="text-slate-600 mb-6">
              O link de redefinição de senha é inválido ou expirou. Por favor, tente novamente.
            </p>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link to="/forgot-password">Solicitar novo link</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Contas</h1>
        </div>

        <Card className="border-slate-200 shadow-md">
          <form onSubmit={handleUpdate}>
            <CardHeader>
              <CardTitle>Criar nova senha</CardTitle>
              <CardDescription>
                Digite sua nova senha abaixo para redefinir o acesso à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar nova senha
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
