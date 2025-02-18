import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
});

export default async function handler(request: Request) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
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
        const { email } = await request.json();

        if (!email) {
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

        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
            email,
            metadata: {
                source: 'mealbyme'
            }
        });

        return new Response(
            JSON.stringify({
                customerId: customer.id
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
        console.error('Error creating customer:', err);
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