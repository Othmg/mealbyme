import Stripe from 'stripe';

// Validate and initialize the Stripe secret key
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set in the environment.');
  throw new Error('STRIPE_SECRET_KEY is not set in the environment.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export default async function handler(request: Request) {
  console.log('Received request:', {
    method: request.method,
    url: request.url,
  });

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    console.warn('Method not allowed:', request.method);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Method not allowed',
          type: 'invalid_request_error',
        },
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Parse the JSON body with detailed logging
  let payload: { email?: string };
  try {
    payload = await request.json();
    console.log('Parsed payload:', payload);
  } catch (jsonError) {
    console.error('Error parsing JSON:', jsonError);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Invalid JSON payload',
          type: 'invalid_request_error',
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const { email } = payload;
  if (!email) {
    console.warn('Email not provided in payload.');
    return new Response(
      JSON.stringify({
        error: {
          message: 'Email is required',
          type: 'invalid_request_error',
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // List existing customers for the provided email
  let existingCustomers;
  try {
    console.log(`Listing customers for email: ${email}`);
    existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });
    console.log('Stripe customers list response:', JSON.stringify(existingCustomers));
  } catch (listError) {
    console.error('Error listing customers for email:', email, listError);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Error listing customers from Stripe',
          type: 'StripeConnectionError',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  let customerId: string;
  let isExisting = false;

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
    isExisting = true;
    console.log(`Existing customer found for email ${email}: ${customerId}`);
  } else {
    try {
      console.log(`No existing customer found for email ${email}. Creating new customer...`);
      const customer = await stripe.customers.create({
        email,
        metadata: {
          source: 'mealbyme',
          created_at: new Date().toISOString(),
        },
      });
      console.log('Stripe response for customer creation:', JSON.stringify(customer));
      customerId = customer.id;
    } catch (createError) {
      console.error('Error creating new customer for email:', email, createError);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Error creating new customer on Stripe',
            type: 'StripeConnectionError',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  }

  const responseBody = { customerId, isExisting };
  console.log('Returning successful response:', responseBody);
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}