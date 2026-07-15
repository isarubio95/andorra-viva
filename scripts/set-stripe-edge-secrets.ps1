# Configura los secrets de Stripe (test) en las Edge Functions de Supabase.
# Requisito: estar logueado con una cuenta que tenga permisos en el proyecto
#   npx supabase login
# Uso (desde la raíz del repo):
#   powershell -ExecutionPolicy Bypass -File scripts/set-stripe-edge-secrets.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$projectRef = (Get-Content "$root\supabase\.temp\project-ref" -ErrorAction SilentlyContinue).Trim()
if (-not $projectRef) {
  $projectRef = 'hwezfhwhaqiqydciaphs'
}

function Get-EnvValue([string]$key) {
  $line = Get-Content "$root\.env" | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
  if (-not $line) { throw "Falta $key en .env" }
  return ($line -replace "^$key=", '').Trim()
}

$tmp = Join-Path $env:TEMP "andorra-viva-stripe-secrets.env"
@(
  "STRIPE_SECRET_KEY=$(Get-EnvValue 'STRIPE_SECRET_KEY')"
  "STRIPE_WEBHOOK_SECRET=$(Get-EnvValue 'STRIPE_WEBHOOK_SECRET')"
  "STRIPE_PRICE_BASIC=$(Get-EnvValue 'STRIPE_PRICE_BASIC')"
  "STRIPE_PRICE_PRO=$(Get-EnvValue 'STRIPE_PRICE_PRO')"
  "STRIPE_PRICE_PREMIUM=$(Get-EnvValue 'STRIPE_PRICE_PREMIUM')"
  "PUBLIC_SITE_URL=$(Get-EnvValue 'PUBLIC_SITE_URL')"
) | Set-Content -Path $tmp -Encoding utf8

try {
  Write-Host "Setting Stripe secrets on project $projectRef ..."
  npx supabase secrets set --project-ref $projectRef --env-file $tmp
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

Write-Host "Done. Redeploy stripe-webhook if it was already running without secrets:"
Write-Host "  npx supabase functions deploy stripe-webhook --project-ref $projectRef --no-verify-jwt --use-api"
Write-Host "  npx supabase functions deploy create-checkout-session --project-ref $projectRef --use-api"
