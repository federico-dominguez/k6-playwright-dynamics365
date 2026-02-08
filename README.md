# k6-playwright-dynamics365

[![CI](https://github.com/federico-dominguez/k6-playwright-dynamics365/actions/workflows/ci.yml/badge.svg)](https://github.com/federico-dominguez/k6-playwright-dynamics365/actions/workflows/ci.yml)

Performance & Automation Testing Framework for Microsoft Dynamics 365 CE (Customer Service/Sales) using k6 (Grafana) and Playwright.

## Features

- **Protocol-level Testing**: High-performance API testing using k6 HTTP client
- **Browser Testing**: UI automation using k6's browser module (Chromium-based)
- **Dynamics 365 Integration**: OAuth2 authentication, Web API client
- **TypeScript**: Full type safety with path aliases
- **CI/CD Ready**: GitHub Actions workflow included

## Prerequisites

- **Node.js** 20.x or later
- **k6** installed ([Installation Guide](https://grafana.com/docs/k6/latest/set-up/install-k6/))
- **Chrome/Chromium** (for browser tests)
- **Dynamics 365 CE** environment with API access

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/federico-dominguez/k6-playwright-dynamics365.git
cd k6-playwright-dynamics365
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Dynamics 365 credentials:

```env
D365_ORG_URL=https://your-org.crm.dynamics.com
D365_CLIENT_ID=your-client-id
D365_CLIENT_SECRET=your-client-secret
D365_TENANT_ID=your-tenant-id
```

### 3. Build and Run

```bash
# Build TypeScript to JavaScript
npm run build

# Run protocol (API) test
npm run test:protocol

# Run browser test
npm run test:browser
```

## Project Structure

```
├── src/
│   ├── config/           # Configuration (thresholds, environments)
│   ├── lib/              # Shared libraries
│   │   ├── auth.ts       # OAuth2 authentication
│   │   └── pages/        # Page Object Models
│   └── tests/
│       ├── browser/      # k6 browser tests
│       └── protocol/     # API tests
├── data/                 # Test data files
├── .github/workflows/    # CI/CD pipelines
└── webpack.config.js     # Build configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:watch` | Build with watch mode |
| `npm run test:protocol` | Run API tests |
| `npm run test:browser` | Run browser tests |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Writing Tests

### Protocol Test Example

```typescript
import http from 'k6/http';
import { check } from 'k6';
import { getAuthHeaders } from '@lib/auth';
import { dynamics365Config } from '@config/index';

export default function () {
  const headers = getAuthHeaders();
  const response = http.get(`${dynamics365Config.apiUrl}/accounts`, { headers });
  
  check(response, {
    'status is 200': r => r.status === 200,
  });
}
```

### Browser Test Example

```typescript
import { browser } from 'k6/browser';
import { check } from 'k6';

export default async function () {
  const page = await browser.newPage();
  await page.goto('https://your-org.crm.dynamics.com');
  
  check(page, {
    'page loaded': p => p.title().includes('Dynamics'),
  });
  
  await page.close();
}
```

## Performance Thresholds

Default thresholds based on Dynamics 365 best practices:

| Metric | Threshold |
|--------|-----------|
| API Response (p95) | < 2s |
| API Response (p99) | < 5s |
| Error Rate | < 1% |
| LCP (p95) | < 4s |
| FCP (p95) | < 3s |

## CI/CD

The project includes a GitHub Actions workflow that:

1. Builds the TypeScript code
2. Checks code formatting
3. Runs smoke tests on PRs (requires secrets configuration)

### Required Secrets

Configure these in your repository settings:

- `D365_ORG_URL`
- `D365_CLIENT_ID`
- `D365_CLIENT_SECRET`
- `D365_TENANT_ID`

## Documentation

- [k6 Documentation](https://grafana.com/docs/k6/latest/)
- [k6 Browser](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [Dynamics 365 Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)

## License

MIT
