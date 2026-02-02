# ensure-vite-server.ps1
# Check if Vite dev server is running and restart if needed after context compression

# Read JSON input from stdin
$input = [Console]::In.ReadToEnd()

# Parse the source field (compact, resume, startup, clear)
try {
    $data = $input | ConvertFrom-Json
    $source = $data.source
} catch {
    $source = ""
}

# Only run on compact (context compression) or resume
if ($source -ne "compact" -and $source -ne "resume") {
    exit 0
}

# Check if any process is listening on common Vite ports (5173-5180)
$viteRunning = $false
$ports = 5173..5180

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $viteRunning = $true
        Write-Host "Vite dev server already running on port $port" -ForegroundColor Green
        break
    }
}

if (-not $viteRunning) {
    Write-Host "Vite dev server not running. Starting..." -ForegroundColor Yellow

    # Start Vite in a new process
    $projectDir = $env:CLAUDE_PROJECT_DIR
    if (-not $projectDir) {
        $projectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    }

    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$projectDir`" && npm run dev" -WindowStyle Minimized

    # Wait for server to start
    Start-Sleep -Seconds 3

    # Verify it started
    $started = $false
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $started = $true
            Write-Host "Vite dev server started on port $port" -ForegroundColor Green
            break
        }
    }

    if (-not $started) {
        Write-Host "Warning: Could not verify Vite server started" -ForegroundColor Red
    }
}

exit 0
