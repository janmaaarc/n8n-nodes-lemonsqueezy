# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.14.0] - 2026-02-24

### Added
- **Output Simplification** - New "Simplify" toggle (default: on) flattens JSON:API responses from nested `{ type, id, attributes: {...} }` into flat `{ id, type, field1, field2 }` objects for easier use in n8n expressions
- **Invoice PDF Binary Download** - Order Generate Invoice and Subscription Invoice Generate operations now have a "Download PDF" option that fetches the invoice PDF and returns it as n8n binary data
- **Customer Lookup by Email** - New `Lookup by Email` operation on the Customer resource finds a customer by email address
- **Subscription Renewal Filter** - `Get Many` subscriptions now supports a `Renews Within Days` filter to find subscriptions renewing within a specified number of days
- **Dependent Variant Dropdown** - Checkout Create's Variant dropdown now filters by the selected Store, showing only relevant variants
- **Store Revenue Summary** - New `Get Revenue Summary` operation returns formatted revenue metrics (total revenue, MRR, 30-day stats) for a store

### Changed
- Error messages improved with user-friendly descriptions and actionable advice for all common HTTP status codes (401, 403, 404, 422, 429, 5xx)
- Rate limit errors now include the Retry-After duration from the API response
- Variant dropdown in Checkout Create depends on Store selection via `loadOptionsDependsOn`

## [0.13.0] - 2026-02-18

### Added
- **Dynamic dropdowns** - Store, Variant, Product, and Discount ID fields now load options dynamically from your Lemon Squeezy account instead of requiring manual ID entry. Applies to Checkout Create (Store, Variant), Customer Create (Store), Discount Create (Store), Webhook Create (Store), and the Trigger node (Store).
- **File Download operation** - New `download` operation on the File resource fetches the file binary and returns it as n8n binary data (configurable property name). Enables direct file handling in workflows (email attachments, S3 uploads, etc.).
- **License Key Instance Deactivate** - New `deactivate` operation on the License Key Instance resource deactivates a specific instance using its instance ID and the associated license key string.
- **Webhook Trigger: Include Event Headers** - New option to expose raw request headers (`X-Event-Name`, `X-Signature`, `X-Request-Id`, `Content-Type`) in the trigger output for debugging and downstream routing.
- **Discount Redemption date range filters** - `Get Many` operation on Discount Redemption now supports `createdAfter` and `createdBefore` date filters for reporting workflows.

### Changed
- Store ID, Variant ID, Product ID, and Discount ID fields converted from free-text to dynamic option dropdowns powered by `loadOptionsMethod`
- Trigger node Store field is now a dynamic dropdown

## [0.12.0] - 2026-02-10

### Critical Fixes
- **Order Generate Invoice** - Corrected endpoint path (`/generate-invoice`), added required invoice fields (name, address, city, zip code, country), uses query parameters instead of empty body
- **Subscription Invoice Generate** - Now uses correct endpoint (`/subscription-invoices/{id}/generate-invoice`), added required invoice fields, uses query parameters
- **Customer Archive** - Replaced invalid DELETE request with PATCH to set status to `archived` (API has no DELETE endpoint)
- **Order Refund** - Added missing `id` field in JSON:API request body for partial refunds
- **Subscription Invoice Refund** - Added missing `id` field in JSON:API request body for partial refunds

### Added
- **Subscription Update** - Added `trial_ends_at` field to extend/shorten trial periods
- **Order Get Many** - Added `order_number` filter
- **Subscription Get Many** - Added `order_item_id` filter
- **License Key Get Many** - Added `order_item_id` filter
- **Subscription Invoice Get Many** - Added `partial_refund` status filter
- **Order Get Many** - Added `partial_refund` status to order status filters
- **Checkout Create** - Added billing address (country, zip), tax number, variant quantities fields
- **Checkout Create** - Added product name/description/media overrides and enabled variants
- **Checkout Create** - Added `terms_privacy_color` and `subscription_preview` display options
- **Discount Create** - Added `is_limited_to_products` and variant IDs for product-scoped discounts
- **Subscription includes** - Added `subscription-invoices` and `subscription-items` relationships

### Changed
- Added `maxValue: 100` to all resource limit fields for consistency
- Extended `buildJsonApiBody` to support array relationships
- Updated TypeScript types: OrderAttributes, SubscriptionInvoiceAttributes, SubscriptionAttributes, AffiliateAttributes, CustomerAttributes

### Fixed
- Removed invalid `status` filter from Product resource (API only supports `store_id`)

## [0.11.0] - 2026-02-06

### Added
- **Price resource** - Get and list prices with variant filtering
- **Subscription Item resource** - Get, list, update subscription items and get current usage for metered billing
- **Affiliate resource** - Get and list affiliates with store and email filtering
- **Order Generate Invoice operation** - Generate downloadable invoices for orders
- **Affiliate Activated webhook event** - New trigger event for affiliate activation
- **Fraudulent order status** - Added to order status filters
- **10 checkout color customization fields** - background, headings, primary text, secondary text, links, borders, checkbox, active state, button, and button text colors
- **Skip Trial checkout option** - Skip free trial periods in checkout creation

### Changed
- Checkout "Dark Mode" option removed (deprecated by Lemon Squeezy API September 2024)
- Checkout "Button Color" replaced with 10 granular color customization fields

### Fixed
- **Removed Discount Update operation** - The Lemon Squeezy API does not support PATCH on discounts; the update operation was incorrectly included and would cause API errors

## [0.10.0] - 2026-02-01

### Added
- **Subscription Pause operation** - Dedicated operation to pause subscriptions with void or free mode options
- **Partial order refunds** - Order Refund operation now supports partial refunds with configurable amount in cents
- **Nested object depth validation** - Prevents stack overflow from deeply nested custom data (max 10 levels)
- **Date range validation** - Validates expires_at dates are in the future where applicable
- **Complete TypeScript types** - Added missing interfaces for OrderItem, DiscountRedemption, UsageRecord, User resources
- **Extended operation types** - Added pause, refund, generate, activate, deactivate, validate to OperationType

### Changed
- Subscription resource now has 6 operations: Cancel, Get, Get Many, Pause, Resume, Update
- Improved field descriptions for pause mode options
- Expanded test suite from 189 to 203 tests (+14 new tests)

### Security
- Object depth validation prevents denial-of-service via deeply nested payloads
- Date validation ensures future dates for expiration fields

## [0.9.0] - 2025-01-28

### Added
- **Subscription Invoice Generate operation** - Generate invoices for subscriptions with outstanding balances
- **Subscription Invoice Refund operation** - Issue full or partial refunds for subscription invoices
- **Custom data payload size validation** - Prevents memory issues with payloads >10KB in checkout creation
- **Retry-After header extraction** - Helper function for smarter rate limit handling
- **Resource validation guard** - Validates resource exists before making API requests
- **JSDoc documentation** - Added comprehensive JSDoc comments to all resource files
- **Additional tests** - 189 tests total (+11 new tests for new features)

### Changed
- Improved field descriptions with units (cents), ranges (0-100 for percent), and examples
- Added maxValue (100) to all limit fields for API compliance
- Better error messages for custom data validation

### Fixed
- Resource endpoint validation now catches unknown resources early

## [0.8.0] - 2025-01-23

### Added
- **File resource** - Get and list product files (digital downloads)
- **Discount Update operation** - Update existing discount codes (name, code, amount, duration, etc.)
- **Discount amount validation** - Validates percent (0-100) and fixed (positive integer) amounts
- **HTTPS validation for webhooks** - Webhook URLs now require HTTPS (Lemon Squeezy requirement)
- **Tests for new features** - 178 tests total with comprehensive coverage

### Changed
- Improved field descriptions with examples and placeholders (Store ID, Customer ID, etc.)
- Added API limit hints (max 100 per page) to limit fields
- Better error messages for webhook URL validation

## [0.7.2] - 2025-01-21

### Fixed
- **n8n community package scanner compliance** - Resolved all ESLint violations:
  - Removed console.log/warn/error statements (n8n requirement)
  - Replaced deprecated `requestWithAuthentication` with `httpRequestWithAuthentication`
  - Removed restricted globals (`setTimeout`, `globalThis`)

### Changed
- Webhook lifecycle errors now handled silently (compliant with n8n community package requirements)
- Removed manual retry logic with delays (use n8n's built-in error handling and workflow retry instead)
- API requests now use simplified single-attempt pattern

## [0.7.0] - 2025-01-20

### Added
- **Usage Record Create operation** - Create usage records for metered billing subscriptions
- **Configurable pagination timeout** - Set custom timeout in Advanced Options for "Return All" operations (0 = no timeout)
- **Webhook secret generator** - Generate cryptographically secure webhook secrets directly in the UI
- **Field hints and documentation links** - Added examples and links to Lemon Squeezy API docs

### Changed
- **Webhook secret minimum length** - Increased from 16 to 32 characters for improved security
- **Webhook creation** - Added deduplication to prevent race conditions when creating webhooks

### Fixed
- Pagination timeout=0 now correctly treated as "no timeout"

## [0.6.0] - 2025-01-19

### Added
- Improved webhook management error handling with proper 404 vs other error distinction
- Pre-API validation for email fields (customer create/update, checkout)
- Pre-API validation for URL fields (webhook URL, redirect URLs, receipt link URLs)
- Webhook secret minimum length validation (16 characters) for security
- Configurable request timeout (default: 30 seconds) for all API requests
- Common filter field generators (createFiltersField, createStatusFilter)

### Changed
- Validation errors now fail fast before making API requests
- Request timeout prevents hanging requests and improves workflow reliability

## [0.5.0] - 2025-01-18

### Added
- Mandatory webhook signature verification (security improvement)
- Replay attack protection with configurable event age threshold
- Sorting support (created_at, updated_at) for "Get Many" operations
- Relationship expansion (include) for fetching related resources
- Pagination timeout protection (default: 5 minutes)
- maxItems limit support for memory optimization
- Comprehensive JSDoc documentation
- SECURITY.md with security policy
- CONTRIBUTING.md with development guidelines

### Changed
- Improved email validation using RFC 5322 compliant regex
- Enhanced URL validation to block internal/private network URLs (SSRF protection)
- IPv6 localhost blocking for complete SSRF protection
- Improved error handling with proper error propagation

### Security
- Removed option to disable webhook signature verification
- Added SSRF protection for all URL inputs

## [0.4.0] - 2025-01-17

### Added
- User resource with `getCurrent` operation
- Expanded test suite to 130 tests (85%+ coverage)
- Comprehensive tests for credentials, node descriptions, and helpers

### Fixed
- TypeScript strict mode warnings in test files

## [0.3.0] - 2025-01-16

### Added
- New resources: Order Items, Subscription Invoices, License Key Instances, Discount Redemptions, Usage Records
- Input validation for emails, URLs, and dates
- Advanced filtering with sorting support
- Relationship expansion helpers
- Security audit in CI pipeline
- Coverage reporting with lcov output

### Changed
- Improved error messages with field-level details

## [0.2.0] - 2025-01-15

### Added
- Initial release with full Lemon Squeezy API support
- Webhook trigger node
- Rate limiting and retry logic

---

## Migration Guide

### Upgrading to v0.7.0

#### Webhook Secret Length
If you have existing webhooks with secrets shorter than 32 characters, you'll need to update them:

1. Go to your Lemon Squeezy Dashboard > Settings > Webhooks
2. Update the webhook secret to be at least 32 characters
3. Update the secret in your n8n credentials

**Recommendation:** Use the new "Generate Secret" button to create a secure 64-character secret.

### Upgrading to v0.5.0

#### Webhook Signature Verification
Webhook signature verification is now **mandatory**. If you were previously running with verification disabled:

1. Ensure your webhook secret is configured in the Lemon Squeezy Trigger node
2. The secret must match the one configured in Lemon Squeezy Dashboard

#### Replay Attack Protection
By default, events older than 5 minutes are rejected. To adjust:

1. Open the Lemon Squeezy Trigger node
2. Set "Max Event Age (Minutes)" to your preferred value
3. Set to 0 to disable replay protection (not recommended)
