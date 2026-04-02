import { useState } from 'react'
import { Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export const isStrongPassword = (pass: string) => {
  const minLength = 8
  const hasUpper = /[A-Z]/.test(pass)
  const hasLower = /[a-z]/.test(pass)
  const hasNumber = /[0-9]/.test(pass)
  const hasSpecial = /[^A-Za-z0-9]/.test(pass)
  return pass.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas informadas são diferentes.',
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
      if (error) throw error

      toast({ title: 'Sucesso', description: 'Sua senha foi alterada com sucesso!' })
      onOpenChange(false)
      setPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast({ title: 'Erro ao alterar senha', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>Crie uma nova senha forte para acessar sua conta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <PasswordInput
              id="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
            <PasswordInput
              id="confirm-new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alteração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
