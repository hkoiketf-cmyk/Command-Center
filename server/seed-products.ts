import { getUncachableStripeClient } from './stripeClient';

/**
 * Ensures the HunterOS Pro product and monthly/yearly prices exist in Stripe.
 * Safe to call on every startup; skips creation if product already exists.
 * Used so /api/stripe/prices returns data and users can click "Add card & start trial".
 */
export async function ensureStripeProducts(): Promise<void> {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'HunterOS Pro'" });
  if (existing.data.length > 0) {
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    if (prices.data.length >= 2) {
      return; // Product and both prices exist
    }
    // Product exists but maybe missing a price; create any missing prices below (we'd need product id)
  }

  let productId: string;
  if (existing.data.length > 0) {
    productId = existing.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: 'HunterOS Pro',
      description: 'Full access to MallenniumDash personal dashboard with all productivity widgets, unlimited desktops, and data storage.',
      metadata: { app: 'mallenniumdash' },
    });
    productId = product.id;
    console.log('Stripe: Created product HunterOS Pro:', productId);
  }

  const prices = await stripe.prices.list({ product: productId, active: true });
  const hasMonthly = prices.data.some((p: { recurring?: { interval?: string } }) => p.recurring?.interval === 'month');
  const hasYearly = prices.data.some((p: { recurring?: { interval?: string } }) => p.recurring?.interval === 'year');

  if (!hasMonthly) {
    const monthly = await stripe.prices.create({
      product: productId,
      unit_amount: 600,
      currency: 'usd',
      recurring: { interval: 'month', trial_period_days: 3 },
      metadata: { plan: 'monthly' },
    });
    console.log('Stripe: Created monthly price $6/mo:', monthly.id);
  }
  if (!hasYearly) {
    const yearly = await stripe.prices.create({
      product: productId,
      unit_amount: 6000,
      currency: 'usd',
      recurring: { interval: 'year', trial_period_days: 3 },
      metadata: { plan: 'yearly' },
    });
    console.log('Stripe: Created yearly price $60/yr:', yearly.id);
  }
}
