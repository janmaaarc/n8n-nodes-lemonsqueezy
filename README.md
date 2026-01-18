# n8n-nodes-lemonsqueezy

This is an n8n community node for [Lemon Squeezy](https://lemonsqueezy.com) - a platform for selling digital products, subscriptions, and software licenses.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

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

## Operations

### Product
- **Get** - Retrieve a single product by ID
- **Get Many** - List all products

### Order
- **Get** - Retrieve a single order by ID
- **Get Many** - List all orders

### Subscription
- **Get** - Retrieve a single subscription by ID
- **Get Many** - List all subscriptions
- **Update** - Update subscription (change variant, pause, cancel)
- **Cancel** - Cancel a subscription

### Customer
- **Create** - Create a new customer
- **Get** - Retrieve a single customer by ID
- **Get Many** - List all customers

### License Key
- **Get** - Retrieve a single license key by ID
- **Get Many** - List all license keys

### Discount
- **Create** - Create a new discount code
- **Delete** - Delete a discount
- **Get** - Retrieve a single discount by ID
- **Get Many** - List all discounts

### Store
- **Get** - Retrieve a single store by ID
- **Get Many** - List all stores

### Variant
- **Get** - Retrieve a single variant by ID
- **Get Many** - List all variants

## Example Workflows

### New Order Notification
1. Use a webhook to receive Lemon Squeezy order events
2. Use this node to get full order details
3. Send notification via Slack/Discord/Email

### Subscription Management
1. Get all active subscriptions
2. Filter subscriptions about to renew
3. Send reminder emails to customers

### License Key Validation
1. Receive license key from your app
2. Use this node to validate the key
3. Return validation result

## Resources

- [Lemon Squeezy API Documentation](https://docs.lemonsqueezy.com/api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
