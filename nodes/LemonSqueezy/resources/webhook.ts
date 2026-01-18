import type { INodeProperties } from 'n8n-workflow';
import { WEBHOOK_EVENTS } from '../constants';

export const webhookOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['webhook'] },
  },
  options: [
    { name: 'Create', value: 'create', action: 'Create a webhook', description: 'Create a new webhook' },
    { name: 'Delete', value: 'delete', action: 'Delete a webhook', description: 'Delete a webhook' },
    { name: 'Get', value: 'get', action: 'Get a webhook', description: 'Retrieve a single webhook by ID' },
    { name: 'Get Many', value: 'getAll', action: 'Get many webhooks', description: 'Retrieve multiple webhooks' },
    { name: 'Update', value: 'update', action: 'Update a webhook', description: 'Update a webhook' },
  ],
  default: 'getAll',
};

export const webhookFields: INodeProperties[] = [
  // Webhook ID for Get/Update/Delete operations
  {
    displayName: 'Webhook ID',
    name: 'webhookId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the webhook',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['get', 'update', 'delete'] },
    },
  },
  // Create Fields
  {
    displayName: 'Store ID',
    name: 'webhookStoreId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the store this webhook belongs to',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['create'] },
    },
  },
  {
    displayName: 'URL',
    name: 'webhookUrl',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'https://your-app.com/webhooks/lemonsqueezy',
    description: 'The URL to send webhook events to',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['create'] },
    },
  },
  {
    displayName: 'Events',
    name: 'webhookEvents',
    type: 'multiOptions',
    required: true,
    options: WEBHOOK_EVENTS,
    default: [],
    description: 'The events to subscribe to',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['create'] },
    },
  },
  {
    displayName: 'Secret',
    name: 'webhookSecret',
    type: 'string',
    required: true,
    default: '',
    typeOptions: { password: true },
    description: 'A secret string used to sign webhook payloads for verification',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: { resource: ['webhook'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Test Mode',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Whether this webhook should only receive test events',
      },
    ],
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['webhook'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        description: 'The URL to send webhook events to',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: WEBHOOK_EVENTS,
        default: [],
        description: 'The events to subscribe to',
      },
      {
        displayName: 'Secret',
        name: 'secret',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'A secret string used to sign webhook payloads',
      },
    ],
  },
  // Return All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['webhook'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1 },
    displayOptions: {
      show: { resource: ['webhook'], operation: ['getAll'], returnAll: [false] },
    },
  },
  // Filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: { resource: ['webhook'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
    ],
  },
];
