/**
 * Lemon Squeezy Operation Handlers
 *
 * Extracted create and update handlers for each resource.
 *
 * @module handlers
 */

import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import {
  lemonSqueezyApiRequest,
  buildJsonApiBody,
  validateField,
  validateDiscountAmount,
  validateCustomDataSize,
  validateObjectDepth,
} from './helpers';

export async function handleCreate(
  ctx: IExecuteFunctions,
  resource: string,
  itemIndex: number,
): Promise<IDataObject> {
  if (resource === 'customer') {
    const storeId = ctx.getNodeParameter('customerStoreId', itemIndex) as string;
    const name = ctx.getNodeParameter('customerName', itemIndex) as string;
    const email = ctx.getNodeParameter('customerEmail', itemIndex) as string;
    const additionalFields = ctx.getNodeParameter('additionalFields', itemIndex);

    // Validate required fields before API call
    validateField('email', email, 'email');

    const body = buildJsonApiBody(
      'customers',
      { name, email, ...additionalFields },
      { store: { type: 'stores', id: storeId } },
    );

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/customers', body);
  }

  if (resource === 'discount') {
    const storeId = ctx.getNodeParameter('discountStoreId', itemIndex) as string;
    const name = ctx.getNodeParameter('discountName', itemIndex) as string;
    const code = ctx.getNodeParameter('discountCode', itemIndex) as string;
    const amount = ctx.getNodeParameter('discountAmount', itemIndex) as number;
    const amountType = ctx.getNodeParameter('discountAmountType', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;

    // Validate discount amount based on type
    validateDiscountAmount(amount, amountType);

    const attributes: IDataObject = {
      name,
      code,
      amount,
      amount_type: amountType,
    };

    if (additionalOptions.duration) {
      attributes.duration = additionalOptions.duration;
    }
    if (additionalOptions.durationInMonths) {
      attributes.duration_in_months = additionalOptions.durationInMonths;
    }
    if (additionalOptions.maxRedemptions) {
      attributes.max_redemptions = additionalOptions.maxRedemptions;
      attributes.is_limited_redemptions = true;
    }
    if (additionalOptions.startsAt) {
      attributes.starts_at = additionalOptions.startsAt;
    }
    if (additionalOptions.expiresAt) {
      attributes.expires_at = additionalOptions.expiresAt;
    }
    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }
    if (additionalOptions.isLimitedToProducts !== undefined) {
      attributes.is_limited_to_products = additionalOptions.isLimitedToProducts;
    }

    const relationships: Record<
      string,
      { type: string; id: string } | Array<{ type: string; id: string }>
    > = {
      store: { type: 'stores', id: storeId },
    };

    if (additionalOptions.variantIds) {
      const variantIdList = (additionalOptions.variantIds as string)
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);
      if (variantIdList.length > 0) {
        relationships.variants = variantIdList.map((vid: string) => ({
          type: 'variants',
          id: vid,
        }));
      }
    }

    const body = buildJsonApiBody('discounts', attributes, relationships);

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/discounts', body);
  }

  if (resource === 'checkout') {
    const storeId = ctx.getNodeParameter('checkoutStoreId', itemIndex) as string;
    const variantId = ctx.getNodeParameter('checkoutVariantId', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;
    const checkoutOptions = ctx.getNodeParameter('checkoutOptions', itemIndex, {}) as IDataObject;

    const attributes: IDataObject = {};
    const checkoutData: IDataObject = {};
    const productOptions: IDataObject = {};
    const checkoutOptionsObj: IDataObject = {};

    if (additionalOptions.customPrice) {
      attributes.custom_price = additionalOptions.customPrice;
    }
    if (additionalOptions.email) {
      // Validate email before API call
      validateField('email', additionalOptions.email as string, 'email');
      checkoutData.email = additionalOptions.email;
    }
    if (additionalOptions.name) {
      checkoutData.name = additionalOptions.name;
    }
    if (additionalOptions.discountCode) {
      checkoutData.discount_code = additionalOptions.discountCode;
    }
    if (additionalOptions.redirectUrl) {
      // Validate URL before API call
      validateField('redirectUrl', additionalOptions.redirectUrl as string, 'url');
      productOptions.redirect_url = additionalOptions.redirectUrl;
    }
    if (additionalOptions.receiptButtonText) {
      productOptions.receipt_button_text = additionalOptions.receiptButtonText;
    }
    if (additionalOptions.receiptLinkUrl) {
      // Validate URL before API call
      validateField('receiptLinkUrl', additionalOptions.receiptLinkUrl as string, 'url');
      productOptions.receipt_link_url = additionalOptions.receiptLinkUrl;
    }
    if (additionalOptions.receiptThankYouNote) {
      productOptions.receipt_thank_you_note = additionalOptions.receiptThankYouNote;
    }
    if (additionalOptions.customData !== undefined && additionalOptions.customData !== null) {
      const customDataValue = additionalOptions.customData;

      // Validate payload size before processing (max 10KB)
      validateCustomDataSize(customDataValue);

      // Validate nesting depth to prevent stack overflow (max 10 levels)
      validateObjectDepth(customDataValue);

      if (typeof customDataValue === 'string') {
        try {
          const parsed: unknown = JSON.parse(customDataValue);
          if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            checkoutData.custom = parsed as IDataObject;
          } else {
            throw new Error('customData must be a valid JSON object');
          }
        } catch (error) {
          throw new Error(
            `Invalid customData: ${error instanceof Error ? error.message : 'must be valid JSON object'}`,
          );
        }
      } else if (typeof customDataValue === 'object' && !Array.isArray(customDataValue)) {
        checkoutData.custom = customDataValue as IDataObject;
      } else {
        throw new Error('customData must be a JSON string or object');
      }
    }
    if (additionalOptions.expiresAt) {
      attributes.expires_at = additionalOptions.expiresAt;
    }
    if (additionalOptions.skipTrial !== undefined) {
      checkoutOptionsObj.skip_trial = additionalOptions.skipTrial;
    }
    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }
    if (additionalOptions.billingAddressCountry || additionalOptions.billingAddressZip) {
      const billingAddress: IDataObject = {};
      if (additionalOptions.billingAddressCountry) {
        billingAddress.country = additionalOptions.billingAddressCountry;
      }
      if (additionalOptions.billingAddressZip) {
        billingAddress.zip = additionalOptions.billingAddressZip;
      }
      checkoutData.billing_address = billingAddress;
    }
    if (additionalOptions.taxNumber) {
      checkoutData.tax_number = additionalOptions.taxNumber;
    }
    if (additionalOptions.variantQuantities) {
      const variantQuantities =
        typeof additionalOptions.variantQuantities === 'string'
          ? JSON.parse(additionalOptions.variantQuantities)
          : additionalOptions.variantQuantities;
      checkoutData.variant_quantities = variantQuantities;
    }
    if (additionalOptions.productName) {
      productOptions.name = additionalOptions.productName;
    }
    if (additionalOptions.productDescription) {
      productOptions.description = additionalOptions.productDescription;
    }
    if (additionalOptions.productMedia) {
      productOptions.media = (additionalOptions.productMedia as string)
        .split(',')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);
    }
    if (additionalOptions.enabledVariants) {
      productOptions.enabled_variants = (additionalOptions.enabledVariants as string)
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter((id: number) => !isNaN(id));
    }

    if (checkoutOptions.embed !== undefined) {
      checkoutOptionsObj.embed = checkoutOptions.embed;
    }
    if (checkoutOptions.logo !== undefined) {
      checkoutOptionsObj.logo = checkoutOptions.logo;
    }
    if (checkoutOptions.desc !== undefined) {
      checkoutOptionsObj.desc = checkoutOptions.desc;
    }
    if (checkoutOptions.media !== undefined) {
      checkoutOptionsObj.media = checkoutOptions.media;
    }
    if (checkoutOptions.discount !== undefined) {
      checkoutOptionsObj.discount = checkoutOptions.discount;
    }
    if (checkoutOptions.subscriptionPreview !== undefined) {
      checkoutOptionsObj.subscription_preview = checkoutOptions.subscriptionPreview;
    }

    const colorFields = [
      { param: 'backgroundColor', api: 'background_color' },
      { param: 'headingsColor', api: 'headings_color' },
      { param: 'primaryTextColor', api: 'primary_text_color' },
      { param: 'secondaryTextColor', api: 'secondary_text_color' },
      { param: 'linksColor', api: 'links_color' },
      { param: 'bordersColor', api: 'borders_color' },
      { param: 'checkboxColor', api: 'checkbox_color' },
      { param: 'activeStateColor', api: 'active_state_color' },
      { param: 'buttonColor', api: 'button_color' },
      { param: 'buttonTextColor', api: 'button_text_color' },
      { param: 'termsPrivacyColor', api: 'terms_privacy_color' },
    ];
    for (const { param, api } of colorFields) {
      if (checkoutOptions[param]) {
        checkoutOptionsObj[api] = checkoutOptions[param];
      }
    }

    if (Object.keys(checkoutData).length > 0) {
      attributes.checkout_data = checkoutData;
    }
    if (Object.keys(productOptions).length > 0) {
      attributes.product_options = productOptions;
    }
    if (Object.keys(checkoutOptionsObj).length > 0) {
      attributes.checkout_options = checkoutOptionsObj;
    }

    const body = buildJsonApiBody('checkouts', attributes, {
      store: { type: 'stores', id: storeId },
      variant: { type: 'variants', id: variantId },
    });

    const checkoutResponse = await lemonSqueezyApiRequest.call(ctx, 'POST', '/checkouts', body);

    if (additionalOptions.shortenUrl) {
      const checkoutData = (checkoutResponse as unknown as { data?: IDataObject })?.data;
      const checkoutAttrs = (checkoutData?.attributes ?? {}) as IDataObject;
      const fullUrl = checkoutAttrs.url as string;
      if (fullUrl) {
        return {
          ...checkoutResponse,
          checkout_short_url: fullUrl.replace('/checkout/buy/', '/buy/'),
        };
      }
    }

    return checkoutResponse;
  }

  if (resource === 'usageRecord') {
    const subscriptionItemId = ctx.getNodeParameter('subscriptionItemId', itemIndex) as string;
    const quantity = ctx.getNodeParameter('quantity', itemIndex) as number;
    const action = ctx.getNodeParameter('action', itemIndex) as string;

    const body = buildJsonApiBody(
      'usage-records',
      { quantity, action },
      { 'subscription-item': { type: 'subscription-items', id: subscriptionItemId } },
    );

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/usage-records', body);
  }

  if (resource === 'webhook') {
    const storeId = ctx.getNodeParameter('webhookStoreId', itemIndex) as string;
    const url = ctx.getNodeParameter('webhookUrl', itemIndex) as string;
    const events = ctx.getNodeParameter('webhookEvents', itemIndex) as string[];
    const secret = ctx.getNodeParameter('webhookSecret', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;

    // Validate URL before API call - Lemon Squeezy requires HTTPS for webhooks
    validateField('url', url, 'httpsUrl');

    // Validate webhook secret minimum length for security (32+ chars recommended)
    if (secret.length < 32) {
      throw new Error(
        'Webhook secret must be at least 32 characters for security. Generate one using: openssl rand -hex 32',
      );
    }

    const attributes: IDataObject = { url, events, secret };

    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }

    const body = buildJsonApiBody('webhooks', attributes, {
      store: { type: 'stores', id: storeId },
    });

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/webhooks', body);
  }

  throw new Error(`Create operation not supported for resource: ${resource}`);
}

export async function handleUpdate(
  ctx: IExecuteFunctions,
  resource: string,
  itemIndex: number,
): Promise<IDataObject> {
  if (resource === 'subscription') {
    const subscriptionId = ctx.getNodeParameter('subscriptionId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.variantId) {
      attributes.variant_id = updateFields.variantId;
    }
    if (updateFields.pause !== undefined && updateFields.pause !== '') {
      attributes.pause = { mode: updateFields.pause };
    } else if (updateFields.pause === '') {
      attributes.pause = null;
    }
    if (updateFields.cancelled !== undefined) {
      attributes.cancelled = updateFields.cancelled;
    }
    if (updateFields.billingAnchor) {
      attributes.billing_anchor = updateFields.billingAnchor;
    }
    if (updateFields.invoiceImmediately !== undefined) {
      attributes.invoice_immediately = updateFields.invoiceImmediately;
    }
    if (updateFields.disableProrations !== undefined) {
      attributes.disable_prorations = updateFields.disableProrations;
    }
    if (updateFields.trialEndsAt) {
      attributes.trial_ends_at = updateFields.trialEndsAt;
    }

    const body = buildJsonApiBody('subscriptions', attributes, undefined, subscriptionId);

    return await lemonSqueezyApiRequest.call(
      ctx,
      'PATCH',
      `/subscriptions/${subscriptionId}`,
      body,
    );
  }

  if (resource === 'customer') {
    const customerId = ctx.getNodeParameter('customerId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.name) {
      attributes.name = updateFields.name;
    }
    if (updateFields.email) {
      // Validate email before API call
      validateField('email', updateFields.email as string, 'email');
      attributes.email = updateFields.email;
    }
    if (updateFields.city) {
      attributes.city = updateFields.city;
    }
    if (updateFields.country) {
      attributes.country = updateFields.country;
    }
    if (updateFields.region) {
      attributes.region = updateFields.region;
    }
    if (updateFields.status) {
      attributes.status = updateFields.status;
    }

    const body = buildJsonApiBody('customers', attributes, undefined, customerId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/customers/${customerId}`, body);
  }

  if (resource === 'licenseKey') {
    const licenseKeyId = ctx.getNodeParameter('licenseKeyId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.activationLimit !== undefined) {
      attributes.activation_limit = updateFields.activationLimit;
    }
    if (updateFields.disabled !== undefined) {
      attributes.disabled = updateFields.disabled;
    }
    if (updateFields.expiresAt) {
      attributes.expires_at = updateFields.expiresAt;
    }

    const body = buildJsonApiBody('license-keys', attributes, undefined, licenseKeyId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/license-keys/${licenseKeyId}`, body);
  }

  if (resource === 'webhook') {
    const webhookId = ctx.getNodeParameter('webhookId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.url) {
      // Validate URL before API call - Lemon Squeezy requires HTTPS for webhooks
      validateField('url', updateFields.url as string, 'httpsUrl');
      attributes.url = updateFields.url;
    }
    if (updateFields.events) {
      attributes.events = updateFields.events;
    }
    if (updateFields.secret) {
      // Validate webhook secret minimum length for security (32+ chars recommended)
      if ((updateFields.secret as string).length < 32) {
        throw new Error(
          'Webhook secret must be at least 32 characters for security. Generate one using: openssl rand -hex 32',
        );
      }
      attributes.secret = updateFields.secret;
    }

    const body = buildJsonApiBody('webhooks', attributes, undefined, webhookId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/webhooks/${webhookId}`, body);
  }

  if (resource === 'subscriptionItem') {
    const subscriptionItemId = ctx.getNodeParameter('subscriptionItemId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.quantity !== undefined) {
      attributes.quantity = updateFields.quantity;
    }
    if (updateFields.invoiceImmediately !== undefined) {
      attributes.invoice_immediately = updateFields.invoiceImmediately;
    }
    if (updateFields.disableProrations !== undefined) {
      attributes.disable_prorations = updateFields.disableProrations;
    }

    const body = buildJsonApiBody('subscription-items', attributes, undefined, subscriptionItemId);

    return await lemonSqueezyApiRequest.call(
      ctx,
      'PATCH',
      `/subscription-items/${subscriptionItemId}`,
      body,
    );
  }

  throw new Error(`Update operation not supported for resource: ${resource}`);
}
