import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class LemonSqueezyApi implements ICredentialType {
  name = 'lemonSqueezyApi';
  displayName = 'Lemon Squeezy API';
  icon = 'file:lemonSqueezy.svg' as const;
  documentationUrl = 'https://docs.lemonsqueezy.com/api';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      placeholder: 'lsq_xxxxxxxxxxxxxxxxxxxxxxxx',
      hint: 'Found in Settings → API in your dashboard',
      description:
        'Your Lemon Squeezy API key. <a href="https://app.lemonsqueezy.com/settings/api" target="_blank">Generate one here</a>.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.lemonsqueezy.com/v1',
      url: '/users/me',
    },
  };
}
