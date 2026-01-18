# n8n-nodes-lemonsqueezy

[![npm version](https://img.shields.io/npm/v/n8n-nodes-lemonsqueezy.svg)](https://www.npmjs.com/package/n8n-nodes-lemonsqueezy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io/) community node for [Lemon Squeezy](https://lemonsqueezy.com) - a platform for selling digital products, subscriptions, and software licenses.

## Features

- **Full CRUD Operations** - Create, read, update, and delete operations for all major resources
- **Webhook Trigger** - Real-time event notifications for orders, subscriptions, and license keys
- **License Key Management** - Validate, activate, and deactivate license keys
- **Checkout Links** - Create dynamic checkout URLs with custom options
- **Rate Limiting** - Built-in retry logic with exponential backoff
- **Type Safety** - Full TypeScript support with comprehensive type definitions

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
| **Checkout** | Create, Get, Get Many |
| **Customer** | Create, Update, Delete, Get, Get Many |
| **Discount** | Create, Delete, Get, Get Many |
| **License Key** | Get, Get Many, Update, Validate, Activate, Deactivate |
| **Order** | Get, Get Many, Refund |
| **Product** | Get, Get Many |
| **Store** | Get, Get Many |
| **Subscription** | Get, Get Many, Update, Cancel, Resume |
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
- `subscription_expired` - Subscription expired
- `subscription_payment_success` - Subscription payment succeeded
- `subscription_payment_failed` - Subscription payment failed
- `subscription_payment_recovered` - Failed payment recovered
- `subscription_payment_refunded` - Subscription payment refunded
- `license_key_created` - License key generated
- `license_key_updated` - License key modified

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
| `status` | Filter by status | Orders, Subscriptions, Customers, License Keys |
| `email` | Filter by email | Orders, Customers |
| `productId` | Filter by product | Subscriptions, License Keys, Variants |
| `variantId` | Filter by variant | Subscriptions, Checkouts |
| `orderId` | Filter by order | Subscriptions, License Keys |

## Error Handling

The node includes built-in error handling:

- **Rate Limiting**: Automatically waits and retries when rate limited (429 errors)
- **Retry Logic**: Retries failed requests with exponential backoff for 5xx errors
- **Continue on Fail**: Enable to process remaining items even if some fail

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

The node handles rate limiting automatically, but if you're hitting limits frequently:

1. Reduce the frequency of API calls
2. Use "Return All" sparingly for large datasets
3. Consider caching responses where appropriate

## Development

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
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

## License

[MIT](LICENSE)

---

Made with 🍋 by [Jan Marc Coloma](https://github.com/janmaaarc)
