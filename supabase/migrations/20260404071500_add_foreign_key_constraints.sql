-- 1. Modify existing foreign keys to use RESTRICT to prevent hard deletions
ALTER TABLE public.cadastro_usuarios DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
ALTER TABLE public.cadastro_usuarios ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;

ALTER TABLE public.accounting_entries DROP CONSTRAINT IF EXISTS accounting_entries_cost_center_id_fkey;
ALTER TABLE public.accounting_entries ADD CONSTRAINT accounting_entries_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE RESTRICT;

ALTER TABLE public.accounting_entries DROP CONSTRAINT IF EXISTS accounting_entries_debit_account_id_fkey;
ALTER TABLE public.accounting_entries ADD CONSTRAINT accounting_entries_debit_account_id_fkey FOREIGN KEY (debit_account_id) REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT;

ALTER TABLE public.accounting_entries DROP CONSTRAINT IF EXISTS accounting_entries_credit_account_id_fkey;
ALTER TABLE public.accounting_entries ADD CONSTRAINT accounting_entries_credit_account_id_fkey FOREIGN KEY (credit_account_id) REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT;

ALTER TABLE public.financial_movements DROP CONSTRAINT IF EXISTS financial_movements_bank_account_id_fkey;
ALTER TABLE public.financial_movements ADD CONSTRAINT financial_movements_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;

ALTER TABLE public.financial_movements DROP CONSTRAINT IF EXISTS financial_movements_cost_center_id_fkey;
ALTER TABLE public.financial_movements ADD CONSTRAINT financial_movements_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id) ON DELETE RESTRICT;

ALTER TABLE public.cost_centers DROP CONSTRAINT IF EXISTS cost_centers_tipo_tga_id_fkey;
ALTER TABLE public.cost_centers ADD CONSTRAINT cost_centers_tipo_tga_id_fkey FOREIGN KEY (tipo_tga_id) REFERENCES public.tipo_conta_tga(id) ON DELETE RESTRICT;

-- 2. Create triggers to prevent soft deletions when dependencies exist

-- Trigger for Departments
CREATE OR REPLACE FUNCTION public.check_department_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE department_id = OLD.id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Não é possível excluir o departamento pois existem usuários vinculados a ele.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_department_soft_delete ON public.departments;
CREATE TRIGGER trg_check_department_soft_delete
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.check_department_soft_delete();

-- Trigger for Cost Centers
CREATE OR REPLACE FUNCTION public.check_cost_center_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.financial_movements WHERE cost_center_id = OLD.id) OR
       EXISTS (SELECT 1 FROM public.accounting_entries WHERE cost_center_id = OLD.id) OR
       EXISTS (SELECT 1 FROM public.account_mapping WHERE cost_center_id = OLD.id) THEN
      RAISE EXCEPTION 'Não é possível excluir o centro de custo pois existem movimentações, lançamentos ou mapeamentos vinculados a ele.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_cost_center_soft_delete ON public.cost_centers;
CREATE TRIGGER trg_check_cost_center_soft_delete
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.check_cost_center_soft_delete();

-- Trigger for Chart of Accounts
CREATE OR REPLACE FUNCTION public.check_chart_account_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = OLD.id OR credit_account_id = OLD.id) OR
       EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = OLD.id) THEN
      RAISE EXCEPTION 'Não é possível excluir a conta contábil pois existem lançamentos ou mapeamentos vinculados a ela.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_chart_account_soft_delete ON public.chart_of_accounts;
CREATE TRIGGER trg_check_chart_account_soft_delete
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION public.check_chart_account_soft_delete();

-- Trigger for Bank Accounts
CREATE OR REPLACE FUNCTION public.check_bank_account_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.financial_movements WHERE bank_account_id = OLD.id) THEN
      RAISE EXCEPTION 'Não é possível excluir a conta bancária pois existem movimentações vinculadas a ela.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_bank_account_soft_delete ON public.bank_accounts;
CREATE TRIGGER trg_check_bank_account_soft_delete
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.check_bank_account_soft_delete();

-- Trigger for Tipo Conta TGA
CREATE OR REPLACE FUNCTION public.check_tga_account_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.cost_centers WHERE tipo_tga_id = OLD.id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Não é possível excluir o tipo de conta TGA pois existem centros de custo vinculados a ele.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_tga_account_soft_delete ON public.tipo_conta_tga;
CREATE TRIGGER trg_check_tga_account_soft_delete
BEFORE UPDATE ON public.tipo_conta_tga
FOR EACH ROW EXECUTE FUNCTION public.check_tga_account_soft_delete();

-- Trigger for Organizations
CREATE OR REPLACE FUNCTION public.check_organization_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.cadastro_usuarios_companies WHERE organization_id = OLD.id) THEN
      RAISE EXCEPTION 'Não é possível excluir a empresa pois existem usuários vinculados a ela.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_organization_soft_delete ON public.organizations;
CREATE TRIGGER trg_check_organization_soft_delete
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.check_organization_soft_delete();
