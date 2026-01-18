import type { INodeProperties } from 'n8n-workflow';
import { LICENSE_KEY_STATUSES } from '../constants';

export const licenseKeyOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['licenseKey'] },
  },
  options: [
    {
      name: 'Activate',
      value: 'activate',
      action: 'Activate a license key',
      description: 'Activate a license key instance',
    },
    {
      name: 'Deactivate',
      value: 'deactivate',
      action: 'Deactivate a license key',
      description: 'Deactivate a license key instance',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a license key',
      description: 'Retrieve a single license key by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many license keys',
      description: 'Retrieve multiple license keys',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a license key',
      description: 'Update a license key',
    },
    {
      name: 'Validate',
      value: 'validate',
      action: 'Validate a license key',
      description: 'Validate a license key',
    },
  ],
  default: 'getAll',
};

export const licenseKeyFields: INodeProperties[] = [
  // License Key ID for Get/Update operations
  {
    displayName: 'License Key ID',
    name: 'licenseKeyId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the license key',
    displayOptions: {
      show: { resource: ['licenseKey'], operation: ['get', 'update'] },
    },
  },
  // License Key for Validate/Activate/Deactivate operations
  {
    displayName: 'License Key',
    name: 'licenseKey',
    type: 'string',
    required: true,
    default: '',
    description: 'The actual license key string',
    displayOptions: {
      show: { resource: ['licenseKey'], operation: ['validate', 'activate', 'deactivate'] },
    },
  },
  // Instance ID for Deactivate operation
  {
    displayName: 'Instance ID',
    name: 'instanceId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the license key instance to deactivate',
    displayOptions: {
      show: { resource: ['licenseKey'], operation: ['deactivate'] },
    },
  },
  // Instance Name for Activate operation
  {
    displayName: 'Instance Name',
    name: 'instanceName',
    type: 'string',
    required: true,
    default: '',
    description: 'A label for the new license key instance (e.g., user email or device name)',
    displayOptions: {
      show: { resource: ['licenseKey'], operation: ['activate'] },
    },
  },
  // Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['licenseKey'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Activation Limit',
        name: 'activationLimit',
        type: 'number',
        default: 0,
        description:
          'The maximum number of instances this license key can be activated on (0 for unlimited)',
        typeOptions: { minValue: 0 },
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Whether the license key is disabled',
      },
      {
        displayName: 'Expires At',
        name: 'expiresAt',
        type: 'dateTime',
        default: '',
        description: 'When the license key expires (ISO 8601 format)',
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
      show: { resource: ['licenseKey'], operation: ['getAll'] },
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
      show: { resource: ['licenseKey'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['licenseKey'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        description: 'Filter by order ID',
      },
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        description: 'Filter by product ID',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: LICENSE_KEY_STATUSES,
        default: '',
        description: 'Filter by license key status',
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        description: 'Filter by disabled status',
      },
    ],
  },
];
