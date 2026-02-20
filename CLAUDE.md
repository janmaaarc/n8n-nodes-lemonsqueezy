# n8n-nodes-lemonsqueezy

## Project Overview

n8n community node for Lemon Squeezy API integration. Provides both regular node operations and webhook trigger functionality for n8n workflows.

**Tech Stack:** TypeScript, n8n node SDK, Jest for testing

## File Structure

```
nodes/LemonSqueezy/
├── LemonSqueezy.node.ts      # Main node (API operations)
├── LemonSqueezy.node.json    # Node metadata
├── LemonSqueezyTrigger.node.ts  # Webhook trigger node
├── descriptions/             # UI field definitions by resource
│   ├── affiliate.ts
│   ├── customer.ts
│   ├── order.ts
│   ├── price.ts
│   ├── subscription.ts
│   ├── subscriptionItem.ts
│   ├── product.ts
│   ├── variant.ts
│   ├── store.ts
│   ├── checkout.ts
│   ├── discount.ts
│   ├── licenseKey.ts
│   ├── usageRecord.ts
│   ├── webhook.ts
│   └── shared.ts            # Shared fields (pagination, timeout)
├── helpers.ts               # API request helpers, validation
└── types.ts                 # TypeScript interfaces

credentials/
└── LemonSqueezyApi.credentials.ts  # API credential definition

__tests__/                   # Jest test files
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

- Jest with 80%+ coverage target
- Mock n8n execution context
- Test both success and error paths
- Test input validation edge cases

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
  '/v1/customers',
  {},
  { filter: { email: 'test@example.com' } }
);
```

### Input Validation

```typescript
import { validateEmail, validateUrl } from './helpers';

const email = this.getNodeParameter('email', i) as string;
validateEmail(email); // Throws NodeOperationError if invalid
```

### Pagination

```typescript
const returnAll = this.getNodeParameter('returnAll', i) as boolean;
if (returnAll) {
  responseData = await lemonSqueezyApiRequestAllItems.call(
    this, 'GET', endpoint, {}, qs
  );
} else {
  const limit = this.getNodeParameter('limit', i) as number;
  qs.page = { size: Math.min(limit, 100) };
  responseData = await lemonSqueezyApiRequest.call(this, 'GET', endpoint, {}, qs);
}
```

## Environment Variables

```bash
# For testing with real API (optional)
LEMON_SQUEEZY_API_KEY=your_test_api_key
```

## Available Commands

```bash
npm run build      # Compile TypeScript
npm run lint       # ESLint check
npm run format     # Prettier format
npm test           # Run Jest tests
npm run test:cov   # Tests with coverage
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **ALWAYS run `npm run lint && npm run build && npm test` before committing and pushing** to catch CI/CD errors locally
- Update CHANGELOG.md for user-facing changes
- Update SECURITY.md for security-related changes

## API Reference

- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)
