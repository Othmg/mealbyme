import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(request: Request) {
  console.log('Edge function handler called');

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    console.log('Invalid method:', request.method);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Method not allowed',
          type: 'invalid_request_error'
        }
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    console.log('Processing POST request');
    const { email } = await request.json();

    if (!email) {
      console.log('Email is required but was not provided');
      return new Response(
        JSON.stringify({
          error: {
            message: 'Email is required',
            type: 'invalid_request_error'
          }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log('Checking for existing customer with email:', email);
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1
    });

    let customerId;

    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      // Create a new customer
      console.log('Creating new customer');
      const customer = await stripe.customers.create({
        email,
        metadata: {
          source: 'mealbyme',
          created_at: new Date().toISOString()
        }
      });
      customerId = customer.id;
      console.log('Created new customer:', customerId);
    }

    return new Response(
      JSON.stringify({
        customerId,
        isExisting: existingCustomers.data.length > 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (err) {
    console.error('Error creating/retrieving customer:', err);
    return new Response(
      JSON.stringify({
        error: {
          message: err instanceof Error ? err.message : 'An error occurred',
          type: 'api_error'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}