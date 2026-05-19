# Synapse Hardware Supplies — Windows setup
# If npm fails with "running scripts is disabled", use dev.cmd instead (Command Prompt).

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

# Allow npm.ps1 in this session only (does not change system policy)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force | Out-Null

# Refresh PATH so node/npm work in terminals opened before Node was installed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

function Invoke-Npm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $npmCmd = Join-Path (Split-Path (Get-Command node -ErrorAction Stop).Source -Parent) "npm.cmd"
    if (Test-Path $npmCmd) {
        & $npmCmd @Args
    } else {
        & npm.cmd @Args
    }
}

function Test-NodeReady {
    $node = Get-Command node -ErrorAction SilentlyContinue
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    return ($null -ne $node -and $null -ne $npm)
}

Write-Host "=== Hardware Supplies App — setup ===" -ForegroundColor Cyan

if (-not (Test-NodeReady)) {
    Write-Host ""
    Write-Host "Node.js / npm not found." -ForegroundColor Yellow
    Write-Host "Install Node.js LTS, then close and reopen PowerShell and run this script again."
    Write-Host ""
    Write-Host "Option A — winget (recommended):" -ForegroundColor Green
    Write-Host '  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements'
    Write-Host ""
    Write-Host "Option B — installer:" -ForegroundColor Green
    Write-Host "  https://nodejs.org/en/download (choose LTS Windows Installer)"
    Write-Host ""
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        $reply = Read-Host "Install Node.js LTS with winget now? (y/n)"
        if ($reply -match '^[Yy]') {
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            Write-Host ""
            Write-Host "After install finishes, CLOSE this terminal, open a NEW one, cd to:" -ForegroundColor Yellow
            Write-Host "  $projectRoot"
            Write-Host "Then run:  .\setup-windows.ps1"
            exit 0
        }
    }
    exit 1
}

$npmVer = (Invoke-Npm -Args "-v") | Out-String
Write-Host "Node: $(node -v)  npm: $($npmVer.Trim())" -ForegroundColor Green
Set-Location $projectRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
Invoke-Npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Starting dev servers (API :4000, Web :3000, Admin :3200)..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Invoke-Npm run dev
