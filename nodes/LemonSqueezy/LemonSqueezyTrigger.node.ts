import type {
  IWebhookFunctions,
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  IDataObject,
} from 'n8n-workflow';
import { WEBHOOK_EVENTS } from './constants';
import { lemonSqueezyApiRequest, verifyWebhookSignature } from './helpers';

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
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        required: true,
        default: '',
        description: 'The ID of the store to receive events from',
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

        // Helper to check if error is a 404 (webhook not found)
        const isNotFoundError = (error: unknown): boolean => {
          if (error && typeof error === 'object') {
            const err = error as { statusCode?: number; httpCode?: number; code?: number };
            return err.statusCode === 404 || err.httpCode === 404 || err.code === 404;
          }
          return false;
        };

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
            const webhookId = String(webhookData.webhookId);

            if (isNotFoundError(error)) {
              // Webhook was deleted externally - this is expected, recreate it
              // eslint-disable-next-line no-console
              console.log(
                `[LemonSqueezy] Webhook ${webhookId} not found (404) - will recreate`,
              );
            } else {
              // Unexpected error - could be auth, network, or server issue
              // eslint-disable-next-line no-console
              console.warn(
                `[LemonSqueezy] Webhook ${webhookId} check failed with unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. Will attempt to recreate.`,
              );
            }

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
              // eslint-disable-next-line no-console
              console.log(
                `[LemonSqueezy] Found existing webhook ${String(existingWebhook.id)} for URL ${webhookUrl}`,
              );
              return true;
            }
          }
        } catch (error) {
          // Error checking webhooks - this is more serious as it could indicate API/auth issues
          // eslint-disable-next-line no-console
          console.error(
            `[LemonSqueezy] Error checking existing webhooks for store ${storeId}: ${error instanceof Error ? error.message : 'Unknown error'}. Will attempt to create new webhook.`,
          );
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

        const response = await lemonSqueezyApiRequest.call(this, 'POST', '/webhooks', body);

        const responseData = response;
        const data = responseData.data as IDataObject | undefined;
        if (data?.id) {
          webhookData.webhookId = data.id;
          return true;
        }

        return false;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');

        if (webhookData.webhookId) {
          const webhookId = String(webhookData.webhookId);

          try {
            await lemonSqueezyApiRequest.call(
              this,
              'DELETE',
              `/webhooks/${webhookId}`,
            );
            // eslint-disable-next-line no-console
            console.log(`[LemonSqueezy] Webhook ${webhookId} deleted successfully`);
          } catch (error) {
            // Check if it's a 404 (already deleted) vs other errors
            const is404 =
              error &&
              typeof error === 'object' &&
              ((error as { statusCode?: number }).statusCode === 404 ||
                (error as { httpCode?: number }).httpCode === 404);

            if (is404) {
              // Webhook was already deleted - this is fine
              // eslint-disable-next-line no-console
              console.log(
                `[LemonSqueezy] Webhook ${webhookId} already deleted (404)`,
              );
            } else {
              // Unexpected error during deletion - log as warning
              // eslint-disable-next-line no-console
              console.warn(
                `[LemonSqueezy] Webhook ${webhookId} deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}. Continuing cleanup.`,
              );
            }
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

    // Check if we should process this event
    const subscribedEvents = this.getNodeParameter('events') as string[];
    if (!eventName || !subscribedEvents.includes(eventName)) {
      // Event not subscribed, acknowledge but don't trigger workflow
      // Log for debugging - helps identify misconfigured webhooks
      // eslint-disable-next-line no-console
      console.log(
        `[LemonSqueezy] Received event '${eventName || 'unknown'}' but not in subscribed events [${subscribedEvents.join(', ')}]. Acknowledged but not processed.`,
      );
      return {
        webhookResponse: {
          status: 200,
          body: { received: true, processed: false, event: eventName },
        },
      };
    }

    // Return the webhook data
    return {
      workflowData: [
        this.helpers.returnJsonArray({
          event: eventName,
          meta: body.meta,
          data: body.data,
          timestamp: new Date().toISOString(),
        }),
      ],
    };
  }
}
