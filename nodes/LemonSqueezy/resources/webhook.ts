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
    {
      name: 'Create',
      value: 'create',
      action: 'Create a webhook',
      description: 'Create a new webhook',
    },
    {
      name: 'Delete',
      value: 'delete',
      action: 'Delete a webhook',
      description: 'Delete a webhook',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a webhook',
      description: 'Retrieve a single webhook by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many webhooks',
      description: 'Retrieve multiple webhooks',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a webhook',
      description: 'Update a webhook',
    },
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
    placeholder: 'e.g., 12345',
    description:
      'The ID of the store this webhook belongs to. Find this in your <a href="https://app.lemonsqueezy.com/settings/stores" target="_blank">Lemon Squeezy Dashboard</a>.',
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
    description:
      'The publicly accessible HTTPS URL to receive webhook events. Must be reachable from the internet.',
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
    description:
      'Select which events should trigger this webhook. See <a href="https://docs.lemonsqueezy.com/api/webhooks#event-types" target="_blank">Lemon Squeezy Webhook Events</a> for details.',
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
    placeholder: 'e.g., a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description:
      'A secure random string (minimum 32 characters) used to sign webhook payloads. Generate one using: openssl rand -hex 32',
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
        placeholder: 'https://your-app.com/webhooks/lemonsqueezy',
        description: 'The publicly accessible HTTPS URL to receive webhook events',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: WEBHOOK_EVENTS,
        default: [],
        description:
          'Select which events should trigger this webhook. See <a href="https://docs.lemonsqueezy.com/api/webhooks#event-types" target="_blank">Lemon Squeezy docs</a> for details.',
      },
      {
        displayName: 'Secret',
        name: 'secret',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        placeholder: 'e.g., a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        description:
          'A secure random string (minimum 32 characters) used to sign webhook payloads. Generate one using: openssl rand -hex 32',
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
