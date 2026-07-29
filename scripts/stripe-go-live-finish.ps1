# Tras pegar sk_live_ / pk_live_ en .env, sube secrets y redeploya Edge Functions Stripe.
# Requisito: cuenta Owner/Admin del proyecto Andorra Viva (hwezfhwhaqiqydciaphs)
#   npx supabase login
#   o: $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/stripe-go-live-finish.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$secretLine = Get-Content .env | Where-Object { $_ -match '^STRIPE_SECRET_KEY=' } | Select-Object -First 1
if (-not $secretLine) { throw 'Falta STRIPE_SECRET_KEY en .env' }
$secretKey = ($secretLine -replace '^STRIPE_SECRET_KEY=', '').Trim()
if ($secretKey -notmatch '^sk_live_|^rk_live_') {
  throw "STRIPE_SECRET_KEY debe ser sk_live_... o rk_live_... (ahora no es live)."
}

Write-Host '1/3 Subiendo secrets...'
& "$PSScriptRoot\set-stripe-edge-secrets.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$projectRef = 'hwezfhwhaqiqydciaphs'
Write-Host '2/3 Redeploy Edge Functions...'
npx supabase functions deploy stripe-webhook --project-ref $projectRef --no-verify-jwt --use-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx supabase functions deploy create-checkout-session --project-ref $projectRef --use-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx supabase functions deploy sync-plan-stripe --project-ref $projectRef --use-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '3/3 Verificando BD...'
node scripts/verify-stripe-live-cut.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Listo. Prueba Checkout en Dashboard (usuario) con plan Basic y reembolsa en Stripe.'
Write-Host 'Webhook live: we_1Tya1HK4TTooP903lWIJMiFY → .../functions/v1/stripe-webhook'
