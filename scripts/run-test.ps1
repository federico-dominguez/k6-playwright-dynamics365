# Load environment variables from .env file
$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "Loading environment from .env file..." -ForegroundColor Cyan
    
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith('#')) {
            $parts = $line.Split('=', 2)
            if ($parts.Length -eq 2) {
                $name = $parts[0].Trim()
                $value = $parts[1].Trim()
                
                # Remove quotes if present
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                
                # Set environment variable for current process
                Set-Item -Path "env:$name" -Value $value
                Write-Host (" + $name") -ForegroundColor Green
            }
        }
    }
    
    # Special handling for K6_HEADLESS to set K6_BROWSER_HEADLESS
    if (Test-Path env:K6_HEADLESS) {
        $env:K6_BROWSER_HEADLESS = $env:K6_HEADLESS
        Write-Host "Set K6_BROWSER_HEADLESS=$env:K6_HEADLESS" -ForegroundColor Cyan
    }
    
    Write-Host ""
} else {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Run k6 test
$testType = $args[0]
if (-not $testType) {
    $testType = "protocol"
}

Write-Host "Running test: $testType" -ForegroundColor Cyan
Write-Host ""

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
    "contact-api" = "dist/tests/protocol/contact.api.js"
    "contact-browser" = "dist/tests/browser/contact.browser.js"
    "contact-hybrid" = "dist/tests/browser/contact.hybrid.js"
}

$testFile = $testFiles[$testType]
if (-not $testFile) {
    Write-Host "Unknown test type: $testType" -ForegroundColor Red
    Write-Host "Available: protocol, browser, login, contact-api, contact-browser, contact-hybrid" -ForegroundColor Yellow
    exit 1
}

Write-Host "Executing k6 test..." -ForegroundColor Gray
Write-Host ""

# Run k6 with environment variables already set in PowerShell session
k6 run $testFile

# Return k6 exit code
exit $LASTEXITCODE
