/**
 * Affiliate Resource
 *
 * Provides read-only operations for affiliates in Lemon Squeezy.
 * Affiliates represent users who have applied to affiliate programs.
 *
 * Available operations:
 * - Get: Retrieve a single affiliate by ID
 * - Get Many: Retrieve multiple affiliates with filtering
 *
 * @see https://docs.lemonsqueezy.com/api/affiliates
 */
import type { INodeProperties } from 'n8n-workflow';

export const affiliateOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['affiliate'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get an affiliate',
      description: 'Retrieve a single affiliate by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many affiliates',
      description: 'Retrieve multiple affiliates',
    },
  ],
  default: 'getAll',
};

export const affiliateFields: INodeProperties[] = [
  // Affiliate ID for Get operation
  {
    displayName: 'Affiliate ID',
    name: 'affiliateId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the affiliate to retrieve',
    displayOptions: {
      show: { resource: ['affiliate'], operation: ['get'] },
    },
  },
  // Return All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['affiliate'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['affiliate'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['affiliate'], operation: ['getAll'] },
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
        displayName: 'User Email',
        name: 'userEmail',
        type: 'string',
        default: '',
        description: 'Filter by user email',
      },
    ],
  },
];
