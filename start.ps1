#!/usr/bin/env pwsh
# EstateFlow Quick Start Script
# Run this from the project root: .\start.ps1

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EstateFlow — Enterprise Real Estate SaaS" -ForegroundColor Cyan
Write-Host "  'Where Real Estate Flows Better'" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test PostgreSQL
Write-Host "[1/3] Testing PostgreSQL connection..." -ForegroundColor Blue
$pgResult = python -c '
import sys; sys.path.insert(0, ".")
from server.config.database import engine
try:
    conn = engine.connect(); conn.close(); print("OK")
except Exception as e: print(f"FAIL: {e}")
' 2>&1

if ($pgResult -like "FAIL*") {
    Write-Host "ERROR: PostgreSQL is not available." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is installed (https://www.postgresql.org/download/windows/)" -ForegroundColor Yellow
    Write-Host "  2. PostgreSQL service is running" -ForegroundColor Yellow
    Write-Host "  3. Database 'estateflow' exists (run: psql -U postgres -c 'CREATE DATABASE estateflow;')" -ForegroundColor Yellow
    Write-Host "  4. Password in server/.env matches your PostgreSQL password" -ForegroundColor Yellow
    exit 1
}

Write-Host "  PostgreSQL connection: OK" -ForegroundColor Green

# Step 2: Create tables and seed if needed
Write-Host "[2/3] Initializing database and seeding..." -ForegroundColor Blue
python "$ProjectRoot\server\database\seed.py"
Write-Host "  Database seeded: OK" -ForegroundColor Green

# Step 3: Start backend in background
Write-Host "[3/3] Starting EstateFlow servers..." -ForegroundColor Blue
Write-Host ""

# Start backend
Write-Host "Starting FastAPI Backend (port 8000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Vite React Frontend (port 5173)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\client'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  EstateFlow is starting up!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "  Health:    http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
