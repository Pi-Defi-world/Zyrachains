# PowerShell script to run Next.js dev server with reduced logging
# This script filters out Fast Refresh logs and other noise

Write-Host "Starting Next.js development server with reduced logging..." -ForegroundColor Green

# Set environment variables to reduce logging
$env:NODE_ENV = "development"
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NODE_OPTIONS = "--no-warnings"

# Start the development server and filter out Fast Refresh logs
pnpm next dev -p 8000 --webpack 2>&1 | Where-Object {
    $_ -notmatch "\[Fast Refresh\]" -and
    $_ -notmatch "turbopack-hot-reloader" -and
    $_ -notmatch "report-hmr-latency" -and
    $_ -notmatch "done in \d+ms"
} 