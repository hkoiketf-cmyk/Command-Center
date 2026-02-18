import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'HunterOS Pro'" });
  if (existing.data.length > 0) {
    console.log('HunterOS Pro product already exists:', existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    for (const price of prices.data) {
      console.log(`  Price: ${price.id} - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'HunterOS Pro',
    description: 'Full access to HunterOS personal dashboard with all 19 productivity widgets, unlimited desktops, and data storage.',
    metadata: {
      app: 'hunteros',
    },
  });

  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 600,
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 3
    },
    metadata: {
      plan: 'monthly',
    },
  });

  console.log('Created monthly price:', monthlyPrice.id, '- $6/month with 3-day trial');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 6000,
    currency: 'usd',
    recurring: {
      interval: 'year',
      trial_period_days: 3,
    },
    metadata: {
      plan: 'yearly',
    },
  });

  console.log('Created yearly price:', yearlyPrice.id, '- $60/year with 3-day trial');
}

createProducts().catch(console.error);
