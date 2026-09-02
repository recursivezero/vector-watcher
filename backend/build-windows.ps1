$ErrorActionPreference = "Stop"

$BackendName = "vector-watcher-backend"
$TargetTriple = "x86_64-pc-windows-msvc"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TauriBinariesDir = Join-Path $ProjectRoot "src-tauri\binaries"

$OutputBinary = "$BackendName-$TargetTriple.exe"

Write-Host "Building $BackendName for $TargetTriple..."

Set-Location $ScriptDir

$ServerFile = Join-Path $ScriptDir "server.py"

if (-not (Test-Path $ServerFile -PathType Leaf)) {
    throw "ERROR: server.py not found"
}

$BuildDir = Join-Path $ScriptDir "build"
$DistDir = Join-Path $ScriptDir "dist"

Remove-Item $BuildDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $DistDir -Recurse -Force -ErrorAction SilentlyContinue

poetry run pyinstaller `
    --onedir `
    --name $BackendName `
    --clean `
    --exclude-module pytest `
    --exclude-module pyright `
    --exclude-module ruff `
    --exclude-module black `
    server.py

$BackendDir = Join-Path $DistDir $BackendName
$BackendExecutable = Join-Path $BackendDir "$BackendName.exe"

if (-not (Test-Path $BackendExecutable -PathType Leaf)) {
    Write-Host "ERROR: Backend executable was not created"
    Get-ChildItem $DistDir -Recurse
    exit 1
}

New-Item `
    -ItemType Directory `
    -Path $TauriBinariesDir `
    -Force | Out-Null

$TargetBinary = Join-Path `
    $TauriBinariesDir `
    $OutputBinary

$TargetRuntimeDir = Join-Path `
    $TauriBinariesDir `
    "_internal"

Remove-Item `
    $TargetBinary `
    -Force `
    -ErrorAction SilentlyContinue

Remove-Item `
    $TargetRuntimeDir `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Copy-Item `
    $BackendExecutable `
    $TargetBinary `
    -Force

Copy-Item `
    (Join-Path $BackendDir "_internal") `
    $TargetRuntimeDir `
    -Recurse `
    -Force

if (-not (Test-Path $TargetBinary -PathType Leaf)) {
    throw "ERROR: Sidecar was not copied"
}

if (-not (Test-Path $TargetRuntimeDir -PathType Container)) {
    throw "ERROR: PyInstaller runtime was not copied"
}

Write-Host ""
Write-Host "Build completed successfully"
Write-Host "Target: $TargetTriple"
Write-Host "Sidecar: $TargetBinary"
Write-Host "Runtime: $TargetRuntimeDir"