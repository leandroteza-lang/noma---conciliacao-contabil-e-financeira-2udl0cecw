import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Deletar Registro',
  description = 'Tem certeza que deseja deletar este registro permanentemente? Esta ação não pode ser desfeita.',
  isLoading = false,
}: Props) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
              if (!isLoading) {
                onClose()
              }
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Sim, deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
