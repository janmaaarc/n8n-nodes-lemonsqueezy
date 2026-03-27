# n8n-nodes-lemonsqueezy

## Project Overview

n8n community node for Lemon Squeezy API integration. Provides both regular node operations and webhook trigger functionality for n8n workflows.

**Tech Stack:** TypeScript, n8n node SDK, Vitest for testing

## File Structure

```
nodes/LemonSqueezy/
├── LemonSqueezy.node.ts        # Main node (API operations)
├── LemonSqueezyTrigger.node.ts # Webhook trigger node
├── constants.ts                # API URLs, status arrays, webhook events
├── helpers.ts                  # API request helpers, validation
├── types.ts                    # TypeScript interfaces
└── resources/                  # UI field definitions by resource
    ├── index.ts                # Barrel export
    ├── shared.ts               # Shared fields (pagination, sorting, includes)
    ├── affiliate.ts
    ├── checkout.ts
    ├── customer.ts             # Includes upsert, getManyById
    ├── discount.ts             # Includes bulkCreate
    ├── discountRedemption.ts
    ├── file.ts
    ├── licenseKey.ts           # Includes bulkActivate, bulkDeactivate
    ├── licenseKeyInstance.ts
    ├── order.ts                # Includes getManyById
    ├── orderItem.ts
    ├── price.ts
    ├── product.ts
    ├── store.ts                # Includes getAnalytics
    ├── subscription.ts         # Includes getManyById
    ├── subscriptionInvoice.ts
    ├── subscriptionItem.ts
    ├── usageRecord.ts
    ├── user.ts
    ├── variant.ts
    └── webhook.ts

credentials/
└── LemonSqueezyApi.credentials.ts  # API credential definition

test/
└── LemonSqueezy.test.ts       # Vitest test file (347 tests)
```

## Critical Rules

### 1. n8n Node Patterns

- Use `INodeType` interface for nodes
- Use `INodeTypeDescription` for metadata
- Operations return `INodeExecutionData[][]`
- Always handle `continueOnFail` option
- Use `this.helpers.httpRequestWithAuthentication` for API calls

### 2. Code Style

- Immutability always - never mutate objects
- No console.log statements
- Proper error handling with NodeApiError/NodeOperationError
- Input validation before API calls
- JSDoc comments on public functions

### 3. Testing

- Vitest with 80%+ coverage target (347 tests)
- Mock n8n execution context
- Test both success and error paths
- Test input validation edge cases
- Test bulk operation JSON parsing

### 4. Security

- Validate emails (RFC 5322)
- Validate URLs (block SSRF - private IPs, localhost)
- Webhook signature verification (HMAC-SHA256)
- 32+ character webhook secrets
- No hardcoded credentials

## Key Patterns

### API Request Helper

```typescript
const response = await lemonSqueezyApiRequest.call(
  this,
  'GET',
  '/customers',
  undefined,
  { 'filter[email]': 'test@example.com' }
);
```

### Input Validation

```typescript
import { validateField } from './helpers';

const email = this.getNodeParameter('email', i) as string;
validateField('email', email, 'email'); // Throws Error if invalid
```

### Pagination

```typescript
const returnAll = this.getNodeParameter('returnAll', i) as boolean;
if (returnAll) {
  responseData = await lemonSqueezyApiRequestAllItems.call(
    this, 'GET', `/${endpoint}`, qs
  );
} else {
  const limit = this.getNodeParameter('limit', i) as number;
  qs['page[size]'] = limit;
  responseData = await lemonSqueezyApiRequest.call(
    this, 'GET', `/${endpoint}`, undefined, qs
  );
}
```

## Environment Variables

```bash
# For testing with real API (optional)
LEMON_SQUEEZY_API_KEY=your_test_api_key
```

## Available Commands

```bash
npm run build         # Compile TypeScript
npm run lint          # ESLint check
npm run format        # Prettier format
npm run format:check  # Check formatting
npm run typecheck     # TypeScript type check
npm test              # Run Vitest tests
npm run test:watch    # Tests in watch mode
npm run test:coverage # Tests with coverage
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **ALWAYS run `npm run format && npm run lint && npm run build && npm test` before committing and pushing** to catch CI/CD errors locally
- Update CHANGELOG.md for user-facing changes
- Update SECURITY.md for security-related changes

## API Reference

- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)
