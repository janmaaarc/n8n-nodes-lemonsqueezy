# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer directly at: janmarccolomaaa@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You can expect:
- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in the security advisory (if desired)

## Security Features

This node implements several security measures:

### Webhook Security

- **Mandatory Signature Verification**: All webhooks are verified using HMAC-SHA256 signatures. This cannot be disabled.
- **Replay Attack Protection**: Events older than a configurable threshold (default: 5 minutes) are rejected.
- **Timing-Safe Comparison**: Signature verification uses `crypto.timingSafeEqual` to prevent timing attacks.

### Input Validation

- **Email Validation**: RFC 5322 compliant validation
- **URL Validation**: Blocks internal/private network URLs to prevent SSRF attacks:
  - localhost, 127.0.0.1, 0.0.0.0
  - IPv6 loopback (::1, [::1])
  - Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  - Link-local: 169.254.x.x (AWS metadata endpoint)
  - Non-http(s) protocols (file://, ftp://, javascript:, etc.)

### API Security

- **Bearer Token Authentication**: API keys are transmitted securely via Authorization header
- **HTTPS Only**: All API communication uses HTTPS
- **Rate Limit Handling**: Automatic retry with backoff prevents API abuse

### Error Handling

- **Safe Error Messages**: API errors are sanitized before display
- **No Credential Exposure**: API keys are never logged or exposed in errors

## Best Practices for Users

1. **API Key Management**
   - Store API keys securely in n8n credentials
   - Rotate keys periodically
   - Use separate keys for test/production

2. **Webhook Configuration**
   - Use strong, random webhook secrets (32+ characters)
   - Keep webhook URLs private
   - Monitor webhook logs for anomalies

3. **Data Handling**
   - Review data before processing
   - Validate customer inputs
   - Don't store sensitive data unnecessarily

## Security Changelog

### v2.0.0
- Added hex character guard in `verifyWebhookSignature` — signature is now validated as exactly 64 hex characters (`/^[0-9a-f]{64}$/i`) before `crypto.timingSafeEqual` is called. Invalid signatures (wrong length, non-hex characters) are rejected immediately without any cryptographic comparison.
- Added `validateHexString` utility to `validation.ts` for reusable hex-format validation.

### v1.0.0
- Added explicit buffer length comparison in `verifyWebhookSignature` before `timingSafeEqual` to ensure timing-safe guarantee regardless of input length
- Added try/catch with descriptive errors around all bulk operation `JSON.parse` calls (discount bulk create, license key bulk activate/deactivate)
- Added `validateDiscountAmount` to each item in bulk discount creation (matching single-create validation)
- Capped Store Analytics queries at 10,000 items with 2-minute timeout to prevent unbounded API fetches
- Fixed immutability violation in checkout URL shortener (uses spread instead of mutation)

### v0.11.0
- Removed Discount Update operation that would cause API errors (PATCH not supported by Lemon Squeezy API)
- Added input validation for 10 checkout color customization fields (hex color format)
- Checkout dark mode option removed (deprecated by Lemon Squeezy API September 2024)

### v0.10.0
- Added nested object depth validation (max 10 levels) to prevent stack overflow attacks
- Added date range validation for expires_at fields (must be in the future)
- Enhanced input validation with 14 additional tests

### v0.9.0
- Added custom data payload size validation (max 10KB) to prevent memory issues
- Added resource validation guard to catch unknown resources early
- Improved input validation with comprehensive tests

### v0.8.0
- Added HTTPS requirement validation for webhook URLs (Lemon Squeezy requires HTTPS)
- Added discount amount validation (prevents invalid percent/fixed amounts)
- Enhanced field validation with better error messages

### v0.7.1
- Updated to use `httpRequestWithAuthentication` (n8n recommended auth method)
- Removed console output for improved security (no sensitive data in logs)
- Removed manual delay mechanisms (compliant with n8n restricted globals policy)

### v0.7.0
- Increased webhook secret minimum length from 16 to 32 characters
- Added webhook creation deduplication to prevent race conditions

### v0.6.0
- Added webhook secret minimum length validation (16 characters)
- Added pre-API validation for email and URL fields
- Added configurable request timeout to prevent hanging requests

### v0.5.0
- Removed option to disable webhook signature verification
- Added replay attack protection with configurable event age
- Enhanced URL validation to block private networks
- Added IPv6 localhost blocking
- Improved error propagation

### v0.4.0
- Added comprehensive input validation
- Improved error handling

### v0.3.0
- Added webhook signature verification
- Added rate limiting protection
