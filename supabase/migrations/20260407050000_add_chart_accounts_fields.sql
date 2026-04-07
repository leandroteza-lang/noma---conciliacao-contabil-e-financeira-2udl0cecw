ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS account_level character varying;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS account_behavior character varying;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS nature character varying;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS purpose text;
