# Memory Vault Start Script
Write-Host "Starting Memory Vault on http://localhost:8080 ..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& "C:\Users\suguk\Downloads\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
