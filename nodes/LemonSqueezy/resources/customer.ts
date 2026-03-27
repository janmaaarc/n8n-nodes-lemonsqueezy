/**
 * Customer Resource
 *
 * Provides operations for managing customers in Lemon Squeezy.
 *
 * Available operations:
 * - Create: Create a new customer
 * - Delete: Archive a customer
 * - Get: Retrieve a single customer by ID
 * - Get Many: Retrieve multiple customers with filtering
 * - Update: Update customer information
 *
 * @see https://docs.lemonsqueezy.com/api/customers
 */
import type { INodeProperties } from 'n8n-workflow';
import { CUSTOMER_STATUSES } from '../constants';

export const customerOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['customer'] },
  },
  options: [
    {
      name: 'Create',
      value: 'create',
      action: 'Create a customer',
      description: 'Create a new customer',
    },
    {
      name: 'Archive',
      value: 'delete',
      action: 'Archive a customer',
      description: 'Archive a customer (Lemon Squeezy API does not support permanent deletion)',
    },
    {
      name: 'Get',
      value: 'get',
      action: 'Get a customer',
      description: 'Retrieve a single customer by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many customers',
      description: 'Retrieve multiple customers',
    },
    {
      name: 'Get Many by ID',
      value: 'getManyById',
      action: 'Get many customers by ID',
      description: 'Retrieve multiple customers by their IDs in parallel',
    },
    {
      name: 'Lookup by Email',
      value: 'lookupByEmail',
      action: 'Lookup a customer by email',
      description: 'Find a customer by their email address',
    },
    {
      name: 'Upsert',
      value: 'upsert',
      action: 'Upsert a customer',
      description: 'Find a customer by email and update, or create if not found',
    },
    {
      name: 'Update',
      value: 'update',
      action: 'Update a customer',
      description: 'Update a customer',
    },
  ],
  default: 'getAll',
};

export const customerFields: INodeProperties[] = [
  // Customer ID for Get/Update/Delete operations
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g., 12345',
    description: 'The ID of the customer (numeric string)',
    displayOptions: {
      show: { resource: ['customer'], operation: ['get', 'update', 'delete'] },
    },
  },
  // Get Many by ID
  {
    displayName: 'Customer IDs',
    name: 'batchCustomerIds',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g., 123,456,789',
    description: 'Comma-separated list of customer IDs to retrieve',
    displayOptions: {
      show: { resource: ['customer'], operation: ['getManyById'] },
    },
  },
  // Lookup by Email
  {
    displayName: 'Email',
    name: 'lookupEmail',
    type: 'string',
    placeholder: 'name@email.com',
    required: true,
    default: '',
    description: 'The email address to search for',
    displayOptions: {
      show: { resource: ['customer'], operation: ['lookupByEmail'] },
    },
  },

  // Create Fields
  {
    displayName: 'Store',
    name: 'customerStoreId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getStores',
    },
    required: true,
    default: '',
    description:
      'The store this customer belongs to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: { resource: ['customer'], operation: ['create'] },
    },
  },
  {
    displayName: 'Name',
    name: 'customerName',
    type: 'string',
    required: true,
    default: '',
    description: 'The full name of the customer',
    displayOptions: {
      show: { resource: ['customer'], operation: ['create'] },
    },
  },
  {
    displayName: 'Email',
    name: 'customerEmail',
    type: 'string',
    placeholder: 'name@email.com',
    required: true,
    default: '',
    description: 'The email address of the customer',
    displayOptions: {
      show: { resource: ['customer'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['customer'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
        description: 'The city of the customer',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string',
        default: '',
        description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        default: '',
        description: 'The region/state of the customer',
      },
    ],
  },
  // Upsert Fields
  {
    displayName: 'Store',
    name: 'upsertStoreId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getStores',
    },
    required: true,
    default: '',
    description:
      'The store to create the customer in (if not found). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: { resource: ['customer'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Email',
    name: 'upsertEmail',
    type: 'string',
    placeholder: 'name@email.com',
    required: true,
    default: '',
    description: 'The email address to look up (and use for creation if not found)',
    displayOptions: {
      show: { resource: ['customer'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Name',
    name: 'upsertName',
    type: 'string',
    required: true,
    default: '',
    description: 'The name to use when creating a new customer',
    displayOptions: {
      show: { resource: ['customer'], operation: ['upsert'] },
    },
  },
  {
    displayName: 'Update If Exists',
    name: 'upsertUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    description: 'Fields to update if the customer already exists',
    displayOptions: {
      show: { resource: ['customer'], operation: ['upsert'] },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Update the customer name',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
        description: 'Update the customer city',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string',
        default: '',
        description: 'ISO 3166-1 alpha-2 country code',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        default: '',
        description: 'Update the customer region',
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
      show: { resource: ['customer'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'The full name of the customer',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        description: 'The email address of the customer',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
        description: 'The city of the customer',
      },
      {
        displayName: 'Country',
        name: 'country',
        type: 'string',
        default: '',
        description: 'ISO 3166-1 alpha-2 country code',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'string',
        default: '',
        description: 'The region/state of the customer',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: CUSTOMER_STATUSES,
        default: '',
        description: 'The status of the customer',
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
      show: { resource: ['customer'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return (API maximum is 100 per page)',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['customer'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['customer'], operation: ['getAll'] },
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
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        description: 'Filter by customer email',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: CUSTOMER_STATUSES,
        default: '',
        description: 'Filter by customer status',
      },
    ],
  },
];
