param(
  [switch]$AlsoDeleteStoredFiles
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendArtifacts = Join-Path $repoRoot "artifacts\\backend"

function Remove-IfExists([string]$path) {
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Force -Recurse
  }
}

# Default local demo DB used by the backend when Supabase is not configured.
Remove-IfExists (Join-Path $backendArtifacts "soterra-demo.sqlite3")

# Scratch DB/files created by automated E2E runs.
Remove-IfExists (Join-Path $backendArtifacts "playwright-e2e.sqlite3")
Remove-IfExists (Join-Path $backendArtifacts "playwright-e2e-storage")

if ($AlsoDeleteStoredFiles) {
  $storageDir = Join-Path $backendArtifacts "storage"
  if (Test-Path -LiteralPath $storageDir) {
    Get-ChildItem -LiteralPath $storageDir -Directory -Filter "rpt-*" -ErrorAction SilentlyContinue |
      ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Recurse }
  }
}

Write-Host "Backend demo data reset complete."

