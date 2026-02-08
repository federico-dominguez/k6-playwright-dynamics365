# k6-playwright-dynamics365

Performance & Automation Testing Framework for Microsoft Dynamics 365 CE (Customer Service/Sales) using k6 (Grafana) and Playwright.

## Overview

This framework provides a comprehensive solution for:
- **Performance Testing**: Load, stress, spike, and soak testing using k6
- **Browser Automation**: UI-level testing using k6's browser module (Playwright-based)
- **API Testing**: Protocol-level testing of Dynamics 365 Web API and OData endpoints
- **CI/CD Integration**: GitHub Actions workflows for automated testing

## Features

- 🚀 **Code-first approach**: TypeScript-based test scripts
- 📊 **Comprehensive metrics**: Custom metrics for Dynamics 365 specific KPIs
- 🔧 **Modular architecture**: Page Object Model, reusable fixtures, and helpers
- 🔄 **CI/CD ready**: Pre-configured GitHub Actions workflows
- 📈 **Performance thresholds**: Built-in SLO validation

## Tech Stack

- [k6](https://k6.io/) - Load testing tool by Grafana Labs
- [k6 Browser](https://grafana.com/docs/k6/latest/using-k6-browser/) - Browser automation (Playwright-based)
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Dynamics 365 Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)

## Getting Started

> 🚧 **Work in Progress**: See [Issue #1](https://github.com/federico-dominguez/k6-playwright-dynamics365/issues/1) for project setup status.

### Prerequisites

- Node.js 20.x or later
- k6 installed ([Installation Guide](https://grafana.com/docs/k6/latest/set-up/install-k6/))
- Chrome/Chromium browser (for browser tests)
- Dynamics 365 CE environment with API access

### Installation

```bash
# Clone the repository
git clone https://github.com/federico-dominguez/k6-playwright-dynamics365.git
cd k6-playwright-dynamics365

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your Dynamics 365 credentials
```

### Running Tests

```bash
# Run protocol-level tests
npm run test:protocol

# Run browser tests
npm run test:browser

# Run all tests with default config
npm run test
```

## Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── lib/             # Shared libraries (API clients, POMs, helpers)
│   ├── scenarios/       # Performance test scenarios
│   └── tests/           # Test files (browser, protocol, hybrid)
├── data/                # Test data files
├── docs/                # Documentation
├── reports/             # Generated reports
└── scripts/             # Utility scripts
```

## Documentation

- [Getting Started](./docs/GETTING_STARTED.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Test Patterns & Best Practices](./docs/TEST_PATTERNS.md)
- [CI/CD Setup Guide](./docs/CI_CD_SETUP.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Grafana k6](https://k6.io/) for the excellent load testing framework
- [Microsoft Dynamics 365](https://dynamics.microsoft.com/) documentation team
- [Playwright](https://playwright.dev/) for browser automation capabilities
