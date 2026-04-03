import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Import from './pages/Import'
import Companies from './pages/Companies'
import Departments from './pages/Departments'
import Users from './pages/Users'
import Mapping from './pages/Mapping'
import Entries from './pages/Entries'
import CostCenters from './pages/CostCenters'
import ChartAccounts from './pages/ChartAccounts'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Approvals from './pages/Approvals'
import TgaAccountTypes from './pages/TgaAccountTypes'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import { AuthProvider } from './hooks/use-auth'
import { ThemeProvider } from './components/ThemeProvider'

const App = () => (
  <ThemeProvider defaultMode="system" defaultColorTheme="default" storageKey="gc-theme">
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="/app" element={<Index />} />
              <Route path="/empresas" element={<Companies />} />
              <Route path="/departamentos" element={<Departments />} />
              <Route path="/usuarios" element={<Users />} />
              <Route path="/import" element={<Import />} />
              <Route path="/mapeamento" element={<Mapping />} />
              <Route path="/lancamentos" element={<Entries />} />
              <Route path="/centros-de-custo" element={<CostCenters />} />
              <Route path="/plano-de-contas" element={<ChartAccounts />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analises" element={<Analysis />} />
              <Route path="/aprovacoes" element={<Approvals />} />
              <Route path="/tipo-conta-tga" element={<TgaAccountTypes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
)

export default App
