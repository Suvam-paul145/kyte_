$ErrorActionPreference = "Stop"

function Test-CommandExists {
    param([string]$CommandName)
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Start-ProjectProcess {
    param(
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command
    )

    if (-not (Test-Path $WorkingDir)) {
        throw "Directory not found for ${Name}: $WorkingDir"
    }

    Write-Host "[$Name] Starting in $WorkingDir" -ForegroundColor Cyan

    return Start-Process `
        -FilePath "powershell" `
        -ArgumentList @(
            "-NoExit",
            "-Command",
            "Set-Location '$WorkingDir'; $Command"
        ) `
        -PassThru
}

function Stop-ListenerOnPort {
    param(
        [int]$Port,
        [string]$Label
    )

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) {
        return
    }

    $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "[$Label] Stopped existing process PID ${procId} on port ${Port}" -ForegroundColor Yellow
        } catch {
            Write-Host "[$Label] Could not stop PID ${procId} on port ${Port}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if (-not (Test-CommandExists "node")) {
    throw "Node.js is required but was not found in PATH."
}

if (-not (Test-CommandExists "npm")) {
    throw "npm is required but was not found in PATH."
}

if (-not (Test-CommandExists "python")) {
    throw "Python is required but was not found in PATH."
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "apps\backend"
$frontendDir = Join-Path $repoRoot "apps\frontend"

$backendVenvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$backendInstall = "if (!(Test-Path '.venv\Scripts\python.exe')) { python -m venv .venv }; .\.venv\Scripts\python.exe -m pip install -r requirements.txt"
$backendRun = ".\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
$frontendInstallAndRun = "npm install; npm run dev"

Write-Host "Booting KYTE backend + frontend..." -ForegroundColor Green
Stop-ListenerOnPort -Port 8000 -Label "Backend"
Stop-ListenerOnPort -Port 3000 -Label "Frontend"
Stop-ListenerOnPort -Port 3001 -Label "Frontend"

if (-not (Test-Path $backendVenvPython)) {
    Write-Host "[Backend] Creating virtual environment and installing dependencies..." -ForegroundColor Yellow
} else {
    Write-Host "[Backend] Ensuring dependencies are installed..." -ForegroundColor Yellow
}

Push-Location $backendDir
try {
    Invoke-Expression $backendInstall
} finally {
    Pop-Location
}

$backendProc = Start-ProjectProcess -Name "Backend" -WorkingDir $backendDir -Command $backendRun
$frontendProc = Start-ProjectProcess -Name "Frontend" -WorkingDir $frontendDir -Command $frontendInstallAndRun

Write-Host ""
Write-Host "Started successfully:" -ForegroundColor Green
Write-Host "  Backend  PID: $($backendProc.Id)  -> http://localhost:8000/docs"
Write-Host "  Frontend PID: $($frontendProc.Id) -> http://localhost:3000"
Write-Host ""
Write-Host "Tip: close the opened PowerShell windows to stop both services." -ForegroundColor DarkGray
