import type {
  IExecuteFunctions,
  IWebhookFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  IDataObject,
} from 'n8n-workflow';
import { WEBHOOK_EVENTS } from './constants';
import {
  lemonSqueezyApiRequest,
  lemonSqueezyApiRequestAllItems,
  verifyWebhookSignature,
} from './helpers';

export class LemonSqueezyTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lemon Squeezy Trigger',
    name: 'lemonSqueezyTrigger',
    icon: 'file:lemonSqueezy.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["events"].join(", ")}}',
    description: 'Receive events from Lemon Squeezy in real-time',
    defaults: {
      name: 'Lemon Squeezy Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'lemonSqueezyApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Store',
        name: 'storeId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getStores',
        },
        required: true,
        default: '',
        description:
          'The store to receive events from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        required: true,
        default: [],
        options: WEBHOOK_EVENTS,
        description: 'The events to listen for',
      },
      {
        displayName: 'Webhook Secret',
        name: 'webhookSecret',
        type: 'string',
        typeOptions: { password: true },
        required: true,
        default: '',
        description: 'A secret string to verify webhook payloads. Generate a secure random string.',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Test Mode Only',
            name: 'testMode',
            type: 'boolean',
            default: false,
            description: 'Whether to only receive test mode events',
          },
          {
            displayName: 'Max Event Age (Minutes)',
            name: 'maxEventAgeMinutes',
            type: 'number',
            default: 5,
            description:
              'Maximum age of webhook events in minutes. Events older than this will be rejected to prevent replay attacks. Set to 0 to disable.',
          },
          {
            displayName: 'Include Event Headers',
            name: 'includeHeaders',
            type: 'boolean',
            default: false,
            description:
              'Whether to include raw webhook request headers (X-Event-Name, X-Signature, etc.) in the output data',
          },
          {
            displayName: 'Filter by Product ID',
            name: 'filterProductId',
            type: 'string',
            default: '',
            description:
              'Only process events for this product ID. Leave empty to accept all products.',
          },
          {
            displayName: 'Filter by Variant ID',
            name: 'filterVariantId',
            type: 'string',
            default: '',
            description:
              'Only process events for this variant ID. Leave empty to accept all variants.',
          },
          {
            displayName: 'Filter by Custom Data Key',
            name: 'filterCustomDataKey',
            type: 'string',
            default: '',
            description:
              'Only process events where custom_data contains this key (e.g., "campaign_id")',
          },
          {
            displayName: 'Filter by Custom Data Value',
            name: 'filterCustomDataValue',
            type: 'string',
            default: '',
            description:
              'Only process events where the custom data key matches this value. Requires "Filter by Custom Data Key".',
          },
          {
            displayName: 'Replay Protection (Order Events, Minutes)',
            name: 'maxAgeOrderMinutes',
            type: 'number',
            default: 0,
            description:
              'Override max event age for order events (minutes). 0 uses the global setting.',
          },
          {
            displayName: 'Replay Protection (Subscription Events, Minutes)',
            name: 'maxAgeSubscriptionMinutes',
            type: 'number',
            default: 0,
            description:
              'Override max event age for subscription events (minutes). 0 uses the global setting.',
          },
        ],
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default');
        const storeId = this.getNodeParameter('storeId') as string;
        const webhookData = this.getWorkflowStaticData('node');

        // Check if we have stored webhook data
        if (webhookData.webhookId) {
          try {
            // Verify the webhook still exists
            await lemonSqueezyApiRequest.call(
              this,
              'GET',
              `/webhooks/${String(webhookData.webhookId)}`,
            );
            return true;
          } catch (error) {
            // Webhook not found or error occurred - will recreate
            // Silently handle both 404 (deleted externally) and other errors
            void error; // Acknowledge error without logging
            delete webhookData.webhookId;
            return false;
          }
        }

        // Check if a webhook with our URL already exists
        try {
          const response = await lemonSqueezyApiRequest.call(this, 'GET', '/webhooks', undefined, {
            'filter[store_id]': storeId,
          });

          const responseData = response;
          const webhooks = responseData.data as IDataObject[] | undefined;
          if (Array.isArray(webhooks)) {
            const existingWebhook = webhooks.find(
              (webhook) => (webhook.attributes as IDataObject)?.url === webhookUrl,
            );

            if (existingWebhook) {
              webhookData.webhookId = existingWebhook.id;
              return true;
            }
          }
        } catch {
          // Error checking webhooks - will attempt to create new webhook
        }

        return false;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default');
        const storeId = this.getNodeParameter('storeId') as string;
        const events = this.getNodeParameter('events') as string[];
        const webhookSecret = this.getNodeParameter('webhookSecret') as string;
        const options = this.getNodeParameter('options') as IDataObject;
        const webhookData = this.getWorkflowStaticData('node');

        const body = {
          data: {
            type: 'webhooks',
            attributes: {
              url: webhookUrl,
              events,
              secret: webhookSecret,
              test_mode: options.testMode || false,
            },
            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: storeId,
                },
              },
            },
          },
        };

        try {
          const response = await lemonSqueezyApiRequest.call(this, 'POST', '/webhooks', body);

          const responseData = response;
          const data = responseData.data as IDataObject | undefined;
          if (data?.id) {
            webhookData.webhookId = data.id;
            return true;
          }
        } catch (error) {
          // Handle race condition: if webhook with same URL was created between checkExists and create
          // Check if error is 409 Conflict or similar, then try to find existing webhook
          const isConflictOrDuplicate =
            error &&
            typeof error === 'object' &&
            ((error as { statusCode?: number }).statusCode === 409 ||
              (error as { statusCode?: number }).statusCode === 422);

          if (isConflictOrDuplicate) {
            // Try to find the existing webhook
            try {
              const existingResponse = await lemonSqueezyApiRequest.call(
                this,
                'GET',
                '/webhooks',
                undefined,
                { 'filter[store_id]': storeId },
              );
              const existingData = existingResponse as { data?: IDataObject[] };
              const webhooks = existingData.data;
              if (Array.isArray(webhooks)) {
                const existingWebhook = webhooks.find(
                  (webhook) => (webhook.attributes as IDataObject)?.url === webhookUrl,
                );
                if (existingWebhook?.id) {
                  webhookData.webhookId = existingWebhook.id;
                  return true;
                }
              }
            } catch {
              // Failed to fetch existing webhook after conflict - will re-throw original error
            }
          }

          // Re-throw original error if not a handled conflict
          throw error;
        }

        return false;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');

        if (webhookData.webhookId) {
          const webhookId = String(webhookData.webhookId);

          try {
            await lemonSqueezyApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}`);
          } catch {
            // Silently handle deletion errors (404 = already deleted, others = continue cleanup)
          }

          delete webhookData.webhookId;
        }

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const options = this.getNodeParameter('options') as IDataObject;
    const webhookSecret = this.getNodeParameter('webhookSecret') as string;

    // Always verify signature - this is a security requirement
    const signature = this.getHeaderData()['x-signature'] as string | undefined;

    if (!signature) {
      return {
        webhookResponse: {
          status: 401,
          body: { error: 'Missing signature header' },
        },
      };
    }

    const bodyData = this.getBodyData();
    const rawBody = JSON.stringify(bodyData);
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      return {
        webhookResponse: {
          status: 401,
          body: { error: 'Invalid signature' },
        },
      };
    }

    const body = this.getBodyData();
    const meta = body.meta as IDataObject | undefined;
    const eventName = meta?.event_name as string | undefined;

    // Replay attack protection: check event timestamp
    const maxEventAgeMinutes =
      typeof options.maxEventAgeMinutes === 'number' ? options.maxEventAgeMinutes : 5;

    if (maxEventAgeMinutes > 0 && meta?.custom_data) {
      const customData = meta.custom_data as IDataObject;
      const eventTimestamp = customData.event_created_at as string | undefined;

      if (eventTimestamp) {
        const eventTime = new Date(eventTimestamp).getTime();
        const now = Date.now();
        const maxAgeMs = maxEventAgeMinutes * 60 * 1000;

        if (now - eventTime > maxAgeMs) {
          return {
            webhookResponse: {
              status: 400,
              body: { error: 'Event too old - possible replay attack' },
            },
          };
        }
      }
    }

    // Also check the created_at field in the data payload if available
    if (maxEventAgeMinutes > 0) {
      const data = body.data as IDataObject | undefined;
      const attributes = data?.attributes as IDataObject | undefined;
      const createdAt = attributes?.created_at as string | undefined;

      if (createdAt) {
        const eventTime = new Date(createdAt).getTime();
        const now = Date.now();
        const maxAgeMs = maxEventAgeMinutes * 60 * 1000;

        if (now - eventTime > maxAgeMs) {
          return {
            webhookResponse: {
              status: 400,
              body: { error: 'Event too old - possible replay attack' },
            },
          };
        }
      }
    }

    // Per-event-type replay protection overrides
    if (maxEventAgeMinutes > 0) {
      const maxAgeOrderMinutes = (options.maxAgeOrderMinutes as number) || 0;
      const maxAgeSubscriptionMinutes = (options.maxAgeSubscriptionMinutes as number) || 0;

      let effectiveMaxAge = maxEventAgeMinutes;
      if (maxAgeOrderMinutes > 0 && eventName?.startsWith('order_')) {
        effectiveMaxAge = maxAgeOrderMinutes;
      } else if (maxAgeSubscriptionMinutes > 0 && eventName?.startsWith('subscription_')) {
        effectiveMaxAge = maxAgeSubscriptionMinutes;
      }

      // Re-check with per-event-type override if different from global
      if (effectiveMaxAge !== maxEventAgeMinutes) {
        const data = body.data as IDataObject | undefined;
        const attributes = data?.attributes as IDataObject | undefined;
        const createdAt = attributes?.created_at as string | undefined;
        if (createdAt) {
          const eventTime = new Date(createdAt).getTime();
          const now = Date.now();
          const maxAgeMs = effectiveMaxAge * 60 * 1000;
          if (now - eventTime > maxAgeMs) {
            return {
              webhookResponse: {
                status: 400,
                body: { error: 'Event too old - possible replay attack (per-event-type check)' },
              },
            };
          }
        }
      }
    }

    // Check if we should process this event
    const subscribedEvents = this.getNodeParameter('events') as string[];
    if (!eventName || !subscribedEvents.includes(eventName)) {
      // Event not subscribed, acknowledge but don't trigger workflow
      return {
        webhookResponse: {
          status: 200,
          body: { received: true, processed: false, event: eventName },
        },
      };
    }

    // Metadata filtering
    const filterProductId = (options.filterProductId as string) || '';
    const filterVariantId = (options.filterVariantId as string) || '';
    const filterCustomDataKey = (options.filterCustomDataKey as string) || '';
    const filterCustomDataValue = (options.filterCustomDataValue as string) || '';

    if (filterProductId || filterVariantId || filterCustomDataKey) {
      const data = body.data as IDataObject | undefined;
      const attributes = data?.attributes as IDataObject | undefined;

      if (filterProductId) {
        const productId = String(attributes?.product_id ?? '');
        if (productId !== filterProductId) {
          return {
            webhookResponse: {
              status: 200,
              body: { received: true, processed: false, reason: 'product_id mismatch' },
            },
          };
        }
      }

      if (filterVariantId) {
        const variantId = String(attributes?.variant_id ?? '');
        if (variantId !== filterVariantId) {
          return {
            webhookResponse: {
              status: 200,
              body: { received: true, processed: false, reason: 'variant_id mismatch' },
            },
          };
        }
      }

      if (filterCustomDataKey) {
        const customData = meta?.custom_data as IDataObject | undefined;
        if (!customData || !(filterCustomDataKey in customData)) {
          return {
            webhookResponse: {
              status: 200,
              body: { received: true, processed: false, reason: 'custom_data key not found' },
            },
          };
        }
        if (
          filterCustomDataValue &&
          String(customData[filterCustomDataKey]) !== filterCustomDataValue
        ) {
          return {
            webhookResponse: {
              status: 200,
              body: { received: true, processed: false, reason: 'custom_data value mismatch' },
            },
          };
        }
      }
    }

    // Return the webhook data
    const outputData: IDataObject = {
      event: eventName,
      meta: body.meta,
      data: body.data,
      timestamp: new Date().toISOString(),
    };

    if (options.includeHeaders) {
      const allHeaders = this.getHeaderData();
      outputData.headers = {
        'x-event-name': allHeaders['x-event-name'] ?? eventName,
        'x-signature': allHeaders['x-signature'],
        'x-request-id': allHeaders['x-request-id'],
        'content-type': allHeaders['content-type'],
      };
    }

    return {
      workflowData: [this.helpers.returnJsonArray(outputData)],
    };
  }

  methods = {
    loadOptions: {
      async getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const response = await lemonSqueezyApiRequestAllItems.call(
          this as unknown as IExecuteFunctions,
          'GET',
          '/stores',
          {},
        );
        return response.map((store) => ({
          name: (store.attributes as IDataObject).name as string,
          value: store.id as string,
        }));
      },
    },
  };
}
