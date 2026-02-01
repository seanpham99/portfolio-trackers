create extension if not exists supabase_vault with schema vault;
-- Fetch a secret from Vault by its unique name
CREATE OR REPLACE FUNCTION public.fetch_secret_by_name(
  p_secret_name TEXT
) RETURNS TEXT AS $$
DECLARE
  v_decrypted TEXT;
BEGIN
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE name = p_secret_name;

  RETURN v_decrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
