param(
  [Parameter(Mandatory = $true)][string]$DbUrl,
  [Parameter(Mandatory = $true)][string]$OutFile
)
# Creates backend/.env with random JWT secrets (different on every machine).
function New-Secret {
  $b = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($b)
  -join ($b | ForEach-Object { $_.ToString('x2') })
}
$lines = @(
  "DATABASE_URL=$DbUrl",
  "PORT=4000",
  "NODE_ENV=development",
  "JWT_ACCESS_SECRET=$(New-Secret)",
  "JWT_REFRESH_SECRET=$(New-Secret)",
  "JWT_RESET_SECRET=$(New-Secret)",
  "JWT_ACCESS_EXPIRES=15m",
  "JWT_REFRESH_EXPIRES_DAYS=30",
  "JWT_RESET_EXPIRES=15m",
  "CORS_ORIGIN=http://localhost:5173"
)
$text = ($lines -join "`n") + "`n"
[System.IO.File]::WriteAllText($OutFile, $text, (New-Object System.Text.UTF8Encoding($false)))
