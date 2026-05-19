# Synapse Engineering — push to GitHub and deploy on Render
# Run in PowerShell from the project root (accept UAC if Git installer prompts).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;" + $env:Path

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not installed. Install from https://git-scm.com/download/win then re-run this script."
  exit 1
}

if (-not (Test-Path ".git")) {
  git init -b main
  git add .
  git commit -m "Synapse Engineering hardware supplies app — home page, quotation, Render config"
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  $repo = Read-Host "Enter your GitHub repo URL (e.g. https://github.com/YOUR_USER/synapse-hardware.git)"
  git remote add origin $repo
}

Write-Host "Pushing to GitHub..."
git push -u origin main

Write-Host @"

Next — Render (https://dashboard.render.com):
1. New + Blueprint → connect this GitHub repo.
2. render.yaml creates: synapse-api, synapse-web, synapse-admin.
3. Set secrets on each service:
   - API: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, CORS_ORIGINS
   - Web & Admin: API_BASE_URL = your API URL (e.g. https://synapse-api.onrender.com)
4. CORS_ORIGINS example: https://synapse-web.onrender.com,https://synapse-admin.onrender.com
5. Deploy all three services.

Verify: API /health, Web home shows hero image, quotation and track pages work.
"@
