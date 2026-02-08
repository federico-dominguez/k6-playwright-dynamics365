# Load environment variables from .env file
$envFile = ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Loaded: $name" -ForegroundColor Green
        }
    }
    Write-Host "`nEnvironment variables loaded successfully!" -ForegroundColor Cyan
} else {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Run k6 test
$testType = $args[0]
if (-not $testType) {
    $testType = "protocol"
}

Write-Host "`nRunning test: $testType" -ForegroundColor Cyan

# Build first
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Map test type to file path
$testFiles = @{
    "protocol" = "dist/tests/protocol/example.api.js"
    "browser" = "dist/tests/browser/example.browser.js"
    "login" = "dist/tests/browser/login.browser.js"
}

$testFile = $testFiles[$testType]
if (-not $testFile) {
    Write-Host "Unknown test type: $testType" -ForegroundColor Red
    Write-Host "Available: protocol, browser, login" -ForegroundColor Yellow
    exit 1
}

# Run k6
k6 run $testFile
