# Themis Platform - Start All Services
# This script starts both the Python Agent API and the Node.js/React servers

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  THEMIS AML INTELLIGENCE PLATFORM - STARTUP" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node is available
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  Starting Python Agent API (Port 8000)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

# Start Python API in background
$pythonJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:PYTHONIOENCODING = 'utf-8'
    python agent/api.py
}

Write-Host "Python API starting (Job ID: $($pythonJob.Id))..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "`n------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  Starting Node.js/React Servers (Ports 3001, 5173)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------`n" -ForegroundColor Yellow

# Start Node servers
npm run dev

# Cleanup on exit
Write-Host "`n`nShutting down services..." -ForegroundColor Yellow
Stop-Job -Job $pythonJob
Remove-Job -Job $pythonJob
Write-Host "✓ All services stopped" -ForegroundColor Green
