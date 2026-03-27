# Contributing to n8n-nodes-lemonsqueezy

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

### Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/n8n-nodes-lemonsqueezy.git
   cd n8n-nodes-lemonsqueezy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Project Structure

```
n8n-nodes-lemonsqueezy/
├── credentials/             # Credential definitions
│   └── LemonSqueezyApi.credentials.ts
├── nodes/LemonSqueezy/      # Node implementations
│   ├── LemonSqueezy.node.ts        # Main node class + execute (20 resources)
│   ├── LemonSqueezyTrigger.node.ts  # Webhook trigger (19 events)
│   ├── handlers.ts          # Create/update operation handlers
│   ├── validation.ts        # Input validation (email, URL, date, size)
│   ├── api.ts               # API request functions, pagination, errors
│   ├── helpers.ts           # Query building, JSON:API, simplification
│   ├── constants.ts         # Endpoints, statuses, webhook events
│   ├── types.ts             # TypeScript interfaces
│   └── resources/           # UI field definitions per resource
│       ├── index.ts         # Barrel export
│       ├── shared.ts        # Shared fields (sorting, includes)
│       └── *.ts             # One file per resource
├── test/                    # Vitest test files (344 tests)
└── dist/                    # Compiled output (generated)
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards below

3. Run quality checks:
   ```bash
   npm run lint        # Check for linting errors
   npm run typecheck   # Check TypeScript types
   npm test           # Run tests
   npm run build      # Ensure it builds
   ```

4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in X"
   git commit -m "docs: update README"
   ```

### Coding Standards

#### TypeScript

- Use strict TypeScript (`strict: true`)
- Avoid `any` types - use specific types or `unknown`
- Export types from `types.ts`
- Use `NodeApiError` for API errors (not generic `Error`)

#### Naming Conventions

- **Files**: camelCase (e.g., `licenseKey.ts`)
- **Classes**: PascalCase (e.g., `LemonSqueezy`)
- **Functions**: camelCase (e.g., `buildFilterParams`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Parameters**: Use `additionalFields` for optional fields in create/update operations

#### Code Style

- Use Prettier for formatting (`npm run format`)
- Follow ESLint rules (`npm run lint`)
- Add JSDoc comments to exported functions
- Keep functions focused and single-purpose

### Testing

- Write tests for new functionality using Vitest
- Maintain >80% code coverage (currently 344 tests)
- Test edge cases and error conditions
- Test bulk operation JSON parsing and validation
- Run `npm run test:coverage` to check coverage

### Adding a New Resource

1. Create the resource file in `nodes/LemonSqueezy/resources/`:
   ```typescript
   // resources/newResource.ts
   import type { INodeProperties } from 'n8n-workflow';

   export const newResourceOperations: INodeProperties = {
     // ... operations
   };

   export const newResourceFields: INodeProperties[] = [
     // ... fields
   ];
   ```

2. Add to `resources/index.ts`

3. Add endpoint mapping to `constants.ts`

4. Add create/update handler in `handlers.ts` (or execution logic in `LemonSqueezy.node.ts`)

5. Add types to `types.ts`

6. Write tests

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all checks pass
4. Request review from maintainers
5. Address feedback promptly

### PR Title Format

Use conventional commit format:
- `feat: add X resource support`
- `fix: resolve issue with Y`
- `docs: update installation guide`
- `test: add tests for Z`
- `refactor: simplify helper functions`

## Reporting Issues

### Bug Reports

Include:
- Node version and n8n version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a [GitHub Issue](https://github.com/janmaaarc/n8n-nodes-lemonsqueezy/issues)
- Check existing issues and discussions
