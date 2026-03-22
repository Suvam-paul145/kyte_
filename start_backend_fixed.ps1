$ErrorActionPreference = "Stop"
Write-Host "Setting up backend environment..."

# 1. Kill any existing process on port 8000
try {
    $portC = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($portC) {
        Write-Host "Killing process on port 8000 (PID: $($portC.OwningProcess))..."
        Stop-Process -Id $portC.OwningProcess -Force
    }
} catch {
    Write-Host "Could not kill process on port 8000: $_"
}

# 2. Check/Create venv
if (-not (Test-Path ".venv_new")) {
    Write-Host "Creating .venv_new..."
    python -m venv .venv_new
}

# 3. Install deps
Write-Host "Installing dependencies..."
.\.venv_new\Scripts\python.exe -m pip install -r apps/backend/requirements.txt

# 4. Run app
$env:GEMINI_API_KEY = "AIzaSyDpdjy5w05z401d8NPY_f1OLI6S24xtDuU"
$env:GEMINI_MOCK_MODE = "false"
Write-Host "Starting backend server..."
.\.venv_new\Scripts\python.exe apps/backend/main.py
