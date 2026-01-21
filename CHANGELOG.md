# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
