# n8n-nodes-lemonsqueezy

[![npm version](https://img.shields.io/npm/v/n8n-nodes-lemonsqueezy.svg)](https://www.npmjs.com/package/n8n-nodes-lemonsqueezy)
[![n8n-community](https://img.shields.io/badge/n8n-community%20node-orange)](https://docs.n8n.io/integrations/community-nodes/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/janmaaarc/n8n-nodes-lemonsqueezy/actions/workflows/ci.yml/badge.svg)](https://github.com/janmaaarc/n8n-nodes-lemonsqueezy/actions/workflows/ci.yml)

An [n8n](https://n8n.io/) community node for [Lemon Squeezy](https://lemonsqueezy.com) - a platform for selling digital products, subscriptions, and software licenses.

## Features

- **Full CRUD Operations** - Create, read, update, and delete operations for all major resources
- **Dynamic Dropdowns** - Store, Product, Variant, and Discount fields load options automatically from your account
- **Output Simplification** - Flatten nested JSON:API responses into simple objects with one toggle
- **Webhook Trigger** - Real-time event notifications for orders, subscriptions, and license keys
- **License Key Management** - Validate, activate, and deactivate license keys
- **File Download** - Download product files as binary data for use in subsequent workflow nodes
- **Checkout Links** - Create dynamic checkout URLs with custom options
- **Input Validation** - RFC 5322 compliant email validation, secure URL validation (blocks internal networks)
- **Detailed Error Messages** - Descriptive error messages with field-level details
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Advanced Query Options** - Sorting and relationship expansion for "Get Many" operations
- **Security Hardened** - Mandatory webhook signature verification with replay attack protection
- **Batch Operations** - Get Many by ID for orders, customers, and subscriptions in parallel
- **Customer Upsert** - Find-or-create customers by email with optional update fields
- **Bulk Discount Creation** - Create multiple discount codes in a single operation
- **License Key Bulk Ops** - Activate or deactivate multiple license keys at once
- **Store Analytics** - Revenue by product, churn rate, LTV, and subscription health metrics
- **Webhook Metadata Filters** - Filter trigger events by product, variant, or custom data
- **Per-Event Replay Protection** - Separate replay attack tolerances for different event types

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-lemonsqueezy`
4. Click **Install**

### npm

```bash
npm install n8n-nodes-lemonsqueezy
```

## Credentials

To use this node, you need a Lemon Squeezy API key:

1. Log in to your [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the generated key and use it in n8n

## Nodes

### Lemon Squeezy

The main node for interacting with the Lemon Squeezy API.

#### Resources & Operations

| Resource | Operations |
|----------|------------|
| **Affiliate** | Get, Get Many |
| **Checkout** | Create, Get, Get Many |
| **Customer** | Create, Update, Archive, Get, Get Many, Get Many by ID, Lookup by Email, Upsert |
| **Discount** | Create, Bulk Create, Delete, Get, Get Many |
| **Discount Redemption** | Get, Get Many |
| **File** | Download, Get, Get Many |
| **License Key** | Get, Get Many, Update, Validate, Activate, Deactivate, Bulk Activate, Bulk Deactivate |
| **License Key Instance** | Deactivate, Get, Get Many |
| **Order** | Get, Get Many, Get Many by ID, Refund, Generate Invoice |
| **Order Item** | Get, Get Many |
| **Price** | Get, Get Many |
| **Product** | Get, Get Many |
| **Store** | Get, Get Many, Get Revenue Summary, Get Analytics |
| **Subscription** | Get, Get Many, Get Many by ID, Update, Cancel, Pause, Resume |
| **Subscription Invoice** | Get, Get Many, Generate, Refund |
| **Subscription Item** | Get, Get Many, Update, Get Current Usage |
| **Usage Record** | Create, Get, Get Many |
| **User** | Get Current |
| **Variant** | Get, Get Many |
| **Webhook** | Create, Update, Delete, Get, Get Many |

### Lemon Squeezy Trigger

Webhook trigger node for receiving real-time events.

#### Supported Events

- `order_created` - New order placed
- `order_refunded` - Order refunded
- `subscription_created` - New subscription started
- `subscription_updated` - Subscription modified
- `subscription_cancelled` - Subscription cancelled
- `subscription_resumed` - Paused subscription resumed
- `subscription_paused` - Subscription paused
- `subscription_unpaused` - Paused subscription unpaused
- `subscription_expired` - Subscription expired
- `subscription_payment_success` - Subscription payment succeeded
- `subscription_payment_failed` - Subscription payment failed
- `subscription_payment_recovered` - Failed payment recovered
- `subscription_payment_refunded` - Subscription payment refunded
- `license_key_created` - License key generated
- `license_key_updated` - License key modified
- `affiliate_activated` - Affiliate activated
- `order_updated` - Order updated
- `subscription_plan_changed` - Subscription plan/variant changed
- `license_key_expired` - License key expired

## Example Workflows

### 1. New Order Notification to Slack

```
Lemon Squeezy Trigger (order_created) → Slack (Send Message)
```

Notify your team instantly when a new order comes in.

### 2. Subscription Churn Prevention

```
Schedule Trigger → Lemon Squeezy (Get Subscriptions, status=past_due) → Send Email
```

Automatically reach out to customers with failed payments.

### 3. License Key Validation API

```
Webhook → Lemon Squeezy (Validate License Key) → Respond to Webhook
```

Build a license validation endpoint for your software.

### 4. Dynamic Checkout Link Generation

```
HTTP Request → Lemon Squeezy (Create Checkout) → Return Checkout URL
```

Create personalized checkout links with pre-filled customer data.

### 5. Customer Sync to CRM

```
Lemon Squeezy Trigger (order_created) → Lemon Squeezy (Get Customer) → HubSpot (Create Contact)
```

Automatically sync new customers to your CRM.

## Filtering

Most "Get Many" operations support filtering:

| Filter | Description | Available On |
|--------|-------------|--------------|
| `storeId` | Filter by store | All resources |
| `status` | Filter by status (includes `partial_refund` for Orders and Subscription Invoices) | Orders, Subscriptions, Customers, License Keys, Subscription Invoices |
| `email` | Filter by email | Orders, Customers |
| `order_number` | Filter by order number | Orders |
| `order_item_id` | Filter by order item | Subscriptions, License Keys |
| `productId` | Filter by product | Subscriptions, License Keys, Variants, Order Items |
| `variantId` | Filter by variant | Subscriptions, Checkouts, Order Items |
| `orderId` | Filter by order | Subscriptions, License Keys, Order Items, Discount Redemptions |
| `subscriptionId` | Filter by subscription | Subscription Invoices |
| `licenseKeyId` | Filter by license key | License Key Instances |
| `discountId` | Filter by discount | Discount Redemptions |

## Advanced Options

"Get Many" operations support advanced query options for sorting and including related resources.

### Sorting

Sort results by any of the following fields:

| Sort Field | Description |
|------------|-------------|
| `created_at` | Sort by creation date |
| `updated_at` | Sort by last update date |

Choose ascending or descending order.

### Relationship Expansion

Include related resources in a single request to reduce API calls:

| Resource | Available Relationships |
|----------|------------------------|
| **Order** | store, customer, order-items, subscriptions, license-keys, discount-redemptions |
| **Subscription** | store, customer, order, order-item, product, variant, subscription-invoices, subscription-items |
| **Customer** | store, orders, subscriptions, license-keys |
| **License Key** | store, customer, order, order-item, product, license-key-instances |
| **Product** | store, variants |
| **Variant** | product, files |
| **Checkout** | store, variant |
| **Discount** | store, discount-redemptions |

**Example:** When fetching orders, include `customer` and `order-items` to get all related data in one request.

**Automatic Flattening:** When Simplify Output is enabled (default), included resources are automatically flattened into each item. Instead of a separate `included` array, you get `store: { id, name, ... }` directly on the order object.

## Security

### Webhook Security

The webhook trigger includes built-in security features:

- **Mandatory Signature Verification** - All webhooks are verified using HMAC-SHA256 signatures
- **Replay Attack Protection** - Events older than the configured threshold (default: 5 minutes) are rejected
- **Configurable Event Age** - Set `Max Event Age (Minutes)` option (0 to disable)

### Input Validation

- **Email Validation** - RFC 5322 compliant validation
- **URL Validation** - Blocks internal/private network URLs to prevent SSRF attacks:
  - localhost, 127.0.0.1, 0.0.0.0
  - Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  - Link-local: 169.254.x.x (AWS metadata endpoint)
  - Only allows http:// and https:// protocols

## Error Handling

The node includes built-in error handling with detailed messages:

- **Continue on Fail**: Enable to process remaining items even if some fail
- **Detailed Errors**: Field-level error details for validation failures
- **Workflow Retry**: Use n8n's built-in workflow error handling for retry logic

### Error Code Reference

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid or malformed request |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - No permission to access resource |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Invalid request data |
| 429 | Rate Limited - Too many requests |
| 500+ | Server Error - Something went wrong on the server |

## Troubleshooting

### "Invalid API Key" Error

1. Verify your API key is correct in the credentials
2. Check if the API key has been revoked in Lemon Squeezy
3. Ensure the key has appropriate permissions

### "Resource Not Found" (404) Error

1. Verify the resource ID is correct
2. Check if the resource exists in Lemon Squeezy
3. Ensure you're using the correct resource type

### Webhook Not Receiving Events

1. Verify the webhook URL is publicly accessible
2. Check if your n8n instance has HTTPS enabled
3. Verify the webhook secret matches
4. Check the webhook events are enabled in Lemon Squeezy

### Rate Limiting Issues

If you encounter rate limiting (429 errors):

1. Configure n8n's workflow error handling to retry on failure
2. Reduce the frequency of API calls
3. Use "Return All" sparingly for large datasets
4. Consider caching responses where appropriate
5. Space out bulk operations using the Wait node

### Validation Errors

If you receive validation errors:

1. Check email fields contain valid email addresses
2. Verify URLs are complete (including https://)
3. Ensure dates are in ISO 8601 format (e.g., 2024-01-15T10:30:00Z)

## Development

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Run linter with auto-fix
npm run lintfix

# Check formatting
npm run format:check

# Format code
npm run format

# Type check
npm run typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Resources

- [Lemon Squeezy API Documentation](https://docs.lemonsqueezy.com/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Community Forum](https://community.n8n.io/)

## Changelog

### v1.0.0

**New Features:**
- **Batch Get Many by ID** - Retrieve multiple orders, customers, or subscriptions by comma-separated IDs in parallel
- **Customer Upsert** - Find by email and update, or create if not found
- **3 New Webhook Events** - `order_updated`, `subscription_plan_changed`, `license_key_expired` (19 total)
- **Webhook Metadata Filtering** - Filter trigger events by Product ID, Variant ID, or custom data key/value
- **Per-Event-Type Replay Protection** - Separate max age overrides for order and subscription events
- **Bulk Discount Creation** - Create multiple discount codes from a JSON array
- **Store Analytics** - Revenue by product, churn rate, LTV, subscription health metrics
- **Checkout URL Shortener** - Generate shortened checkout URLs
- **License Key Bulk Activate/Deactivate** - Process multiple license keys at once
- **60 New Tests** - 347 total tests

**Security:**
- Explicit buffer length check in webhook signature verification
- Input validation for all bulk JSON operations
- Analytics queries capped at 10,000 items with 2-minute timeout

### v0.15.0

**New Features:**
- **Include Relationship Flattening** - Included resources are automatically flattened into simplified output (e.g., `store: { id, name }` directly on order)
- **Test Backfill** - 51 new tests covering all v0.13.0/v0.14.0/v0.15.0 features (287 total)

**Bug Fixes:**
- Fixed Customer `Lookup by Email` operation not appearing in dropdown
- Fixed File `Download` operation not appearing in dropdown
- Fixed Subscription Invoice Generate missing PDF download fields

### v0.14.0

**New Features:**
- **Output Simplification** - Flatten nested JSON:API responses into simple key-value objects with one toggle (on by default)
- **Invoice PDF Binary Download** - Download generated invoices as PDF binary data from Order and Subscription Invoice Generate operations
- **Customer Lookup by Email** - Find a customer by email in a single operation
- **Subscription Renewal Filter** - Filter subscriptions by upcoming renewal date (within N days)
- **Dependent Variant Dropdown** - Variant dropdown in Checkout Create filters by selected Store
- **Store Revenue Summary** - Get formatted revenue metrics (total revenue, MRR, 30-day stats) for any store

**Improvements:**
- User-friendly error messages with actionable advice for all HTTP status codes
- Rate limit errors include Retry-After duration

### v0.13.0

**New Features:**
- **Dynamic dropdowns** - Store, Product, Variant, and Discount ID fields now load options dynamically from your Lemon Squeezy account. No more copy-pasting IDs — just select from the list.
- **File Download operation** - New `download` operation on the File resource returns file binary data, ready for email attachments, S3 uploads, or any binary-aware downstream node.
- **License Key Instance Deactivate** - Deactivate a specific license key instance directly from the License Key Instance resource.
- **Webhook Trigger: Include Event Headers** - Optional setting to expose raw request headers in the trigger output for routing and debugging.

### v0.12.0

**Critical Fixes:**
- Fixed **Order Generate Invoice** - corrected endpoint path, added required invoice fields, uses query parameters
- Fixed **Subscription Invoice Generate** - uses correct endpoint, added required invoice fields
- Fixed **Customer Archive** - replaced invalid DELETE with PATCH to set status to `archived`
- Fixed **Order Refund** - added missing `id` field in JSON:API body for partial refunds
- Fixed **Subscription Invoice Refund** - added missing `id` field in JSON:API body for partial refunds

**New Features:**
- Added `trial_ends_at` field to **Subscription Update** for extending/shortening trial periods
- Added `order_number` filter to **Order Get Many**
- Added `order_item_id` filter to **Subscription Get Many** and **License Key Get Many**
- Added `partial_refund` status filter to **Subscription Invoice** and **Order** status filters
- Added billing address, tax number, variant quantities to **Checkout Create**
- Added product name/description/media overrides and enabled variants to **Checkout Create**
- Added `terms_privacy_color` and `subscription_preview` display options to **Checkout Create**
- Added `is_limited_to_products` and variant IDs to **Discount Create** for product-scoped discounts
- Added `subscription-invoices` and `subscription-items` relationships to **Subscription** includes

**Improvements:**
- Added `maxValue: 100` to all resource limit fields for consistency
- Extended `buildJsonApiBody` to support array relationships
- Updated TypeScript types: OrderAttributes, SubscriptionInvoiceAttributes, SubscriptionAttributes, AffiliateAttributes, CustomerAttributes

**Fixes:**
- Removed invalid `status` filter from Product resource (API only supports `store_id`)

### v0.11.0

**New Features:**
- Added **Price resource** - Get and list prices with variant filtering
- Added **Subscription Item resource** - Get, list, update subscription items and get current usage for metered billing
- Added **Affiliate resource** - Get and list affiliates with store and email filtering
- Added **Order Generate Invoice operation** - Generate downloadable invoices for orders
- Added **Affiliate Activated webhook event** - New trigger event for affiliate activation
- Added **Fraudulent order status** to order status filters
- Added **10 checkout color customization fields** - background, headings, primary text, secondary text, links, borders, checkbox, active state, button, and button text colors
- Added **Skip Trial checkout option** - Skip free trial periods in checkout creation

**Changes:**
- Checkout "Dark Mode" option removed (deprecated by Lemon Squeezy API September 2024)
- Checkout "Button Color" replaced with 10 granular color customization fields

**Fixes:**
- Removed Discount Update operation (Lemon Squeezy API does not support PATCH on discounts)

### v0.10.0

**New Features:**
- Added **Subscription Pause operation** - Pause subscriptions with void or free mode
- Added **Partial order refunds** - Refund operation now supports custom amounts in cents
- Added nested object depth validation (max 10 levels) for custom data
- Added date range validation for expires_at fields
- Complete TypeScript types for all resources (OrderItem, DiscountRedemption, UsageRecord, User)

**Security:**
- Object depth validation prevents denial-of-service attacks via deeply nested payloads
- Date validation ensures future dates for expiration fields

**Improvements:**
- 203 tests with comprehensive coverage (+14 new tests)

### v0.9.0

**New Features:**
- Added **Subscription Invoice Generate operation** for generating invoices on subscriptions with outstanding balances
- Added **Subscription Invoice Refund operation** for issuing full or partial refunds
- Added custom data payload size validation (max 10KB) for checkout creation
- Added Retry-After header extraction for smarter rate limit handling
- Added resource validation guard to catch unknown resources early

**Improvements:**
- Added JSDoc documentation to all resource files
- Improved field descriptions with units (cents), ranges (0-100), and examples
- Added maxValue (100) to all limit fields for API compliance
- 189 tests with comprehensive coverage

### v0.8.0

**New Features:**
- Added **File resource** for accessing product files (digital downloads)
- Added **Discount Update operation** for modifying existing discount codes
- Added discount amount validation (0-100 for percent, positive integer for fixed)
- Webhook URLs now require HTTPS (Lemon Squeezy requirement)

**Improvements:**
- Enhanced field descriptions with examples and placeholders
- Added API limit hints (max 100 per page) to limit fields
- 178 tests with comprehensive coverage

### v0.7.2

**n8n Community Package Compliance:**
- Resolved all n8n community package scanner ESLint violations
- Replaced deprecated `requestWithAuthentication` with `httpRequestWithAuthentication`
- Removed restricted globals (use n8n's built-in workflow retry for error handling)

### v0.7.0

**New Features:**
- Added Usage Record Create operation for metered billing support
- Added configurable pagination timeout in Advanced Options UI for "Return All" operations
- Added field hints with examples and documentation links for better UX
- Added CHANGELOG.md with migration guide for breaking changes

**Security:**
- Increased webhook secret minimum length from 16 to 32 characters
- Added webhook creation deduplication to prevent race conditions

**Bug Fixes:**
- Fixed pagination timeout=0 handling (now correctly treated as "no timeout")

### v0.6.0

**Reliability & Error Handling:**
- Improved webhook management error handling with proper 404 vs other error distinction

**Input Validation:**
- Added pre-API validation for email fields (customer create/update, checkout)
- Added pre-API validation for URL fields (webhook URL, redirect URLs, receipt link URLs)
- Added webhook secret minimum length validation (16 characters) for security
- Validation errors now fail fast before making API requests

**Performance:**
- Added configurable request timeout (default: 30 seconds) for all API requests
- Timeout prevents hanging requests and improves workflow reliability

**Code Quality:**
- Added common filter field generators to reduce code duplication
- Added createFiltersField, createStatusFilter factory functions

### v0.5.0

**Security & Stability Improvements:**
- Mandatory webhook signature verification (removed option to disable)
- Added replay attack protection with configurable event age threshold
- Improved email validation using RFC 5322 compliant regex
- Enhanced URL validation to block internal/private network URLs (SSRF protection)
- IPv6 localhost blocking (`[::1]`) for complete SSRF protection
- Improved error handling with proper error propagation
- Added proper null checks and type safety for custom data handling

**New Features:**
- Added sorting support (created_at, updated_at) for "Get Many" operations
- Added relationship expansion (include) for fetching related resources in single requests
- Advanced options available for: Order, Subscription, Customer, License Key, Product, Variant, Checkout, Discount
- Added pagination timeout protection (default: 5 minutes) to prevent long-running requests
- Added maxItems limit support for memory optimization on large datasets

**Code Quality:**
- Added comprehensive JSDoc documentation to all helper functions
- Created shared field generators to reduce code duplication
- Added TypeScript types for webhooks, errors, and pagination (WebhookMeta, ApiError, PaginationOptions)
- Improved type safety throughout the codebase

**Documentation:**
- Added SECURITY.md with security policy and vulnerability reporting guidelines
- Added CONTRIBUTING.md with development setup and contribution guidelines

**Test Coverage:**
- Expanded test suite from 132 to 176 tests (+33%)
- Added tests for retry logic helpers (sleep, isRateLimitError, isRetryableError)
- Added webhook signature edge case tests (unicode, long payloads, special characters)
- Added shared resource options tests
- Added input validation edge case tests
- Overall coverage improved to 87%+ statements

### v0.4.0

- Added User resource for fetching authenticated user information (`getCurrent` operation)
- Expanded test suite to 130 tests with 85%+ statement coverage
- Added comprehensive tests for credentials, node descriptions, and helpers
- Fixed TypeScript strict mode warnings in test files
- Updated coverage thresholds to 70%

### v0.3.0

- Added new resources: Order Items, Subscription Invoices, License Key Instances, Discount Redemptions, Usage Records
- Added input validation for emails, URLs, and dates
- Improved error messages with field-level details
- Added advanced filtering with sorting support
- Added relationship expansion helpers
- Added security audit in CI pipeline
- Added coverage reporting with lcov output

### v0.2.0

- Initial release with full Lemon Squeezy API support
- Webhook trigger node
- Rate limiting and retry logic

## License

[MIT](LICENSE)

---

Made with 🍋 by [Jan Marc Coloma](https://github.com/janmaaarc)
