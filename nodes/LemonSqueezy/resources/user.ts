import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['user'],
      },
    },
    options: [
      {
        name: 'Get Current',
        value: 'getCurrent',
        description: 'Get the currently authenticated user',
        action: 'Get current user',
      },
    ],
    default: 'getCurrent',
  },
];

export const userFields: INodeProperties[] = [];
