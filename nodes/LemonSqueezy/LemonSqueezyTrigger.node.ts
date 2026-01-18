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
            displayName: 'Verify Signature',
            name: 'verifySignature',
            type: 'boolean',
            default: true,
            description: 'Whether to verify the webhook signature (recommended)',
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
              `/webhooks/${webhookData.webhookId}`,
            );
            return true;
          } catch {
            // Webhook doesn't exist anymore
            delete webhookData.webhookId;
            return false;
          }
        }

        // Check if a webhook with our URL already exists
        try {
          const response = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            '/webhooks',
            undefined,
            { 'filter[store_id]': storeId },
          );

          const webhooks = (response as IDataObject).data as IDataObject[];
          if (Array.isArray(webhooks)) {
            const existingWebhook = webhooks.find(
              (webhook) =>
                (webhook.attributes as IDataObject)?.url === webhookUrl,
            );

            if (existingWebhook) {
              webhookData.webhookId = existingWebhook.id;
              return true;
            }
          }
        } catch {
          // Error checking webhooks, assume doesn't exist
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

        const response = await lemonSqueezyApiRequest.call(
          this,
          'POST',
          '/webhooks',
          body,
        );

        const data = (response as IDataObject).data as IDataObject;
        if (data?.id) {
          webhookData.webhookId = data.id;
          return true;
        }

        return false;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');

        if (webhookData.webhookId) {
          try {
            await lemonSqueezyApiRequest.call(
              this,
              'DELETE',
              `/webhooks/${webhookData.webhookId}`,
            );
          } catch {
            // Webhook might already be deleted
          }

          delete webhookData.webhookId;
        }

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const options = this.getNodeParameter('options') as IDataObject;
    const webhookSecret = this.getNodeParameter('webhookSecret') as string;

    // Verify signature if enabled
    if (options.verifySignature !== false) {
      const signature = req.headers['x-signature'] as string;

      if (!signature) {
        return {
          webhookResponse: {
            status: 401,
            body: { error: 'Missing signature header' },
          },
        };
      }

      const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        return {
          webhookResponse: {
            status: 401,
            body: { error: 'Invalid signature' },
          },
        };
      }
    }

    const body = req.body as IDataObject;
    const eventName = (body.meta as IDataObject)?.event_name as string;

    // Check if we should process this event
    const subscribedEvents = this.getNodeParameter('events') as string[];
    if (!subscribedEvents.includes(eventName)) {
      // Event not subscribed, acknowledge but don't trigger workflow
      return {
        webhookResponse: {
          status: 200,
          body: { received: true, processed: false },
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
