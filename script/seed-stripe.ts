/**
 * Run once to create HunterOS Pro product and $6/mo + $60/yr prices in Stripe.
 * The server also runs this on startup; use this if you need to seed before starting the server.
 */
import { ensureStripeProducts } from "../server/seed-products";

ensureStripeProducts()
  .then(() => console.log("Stripe products ready. Restart the server and sync will fill the DB."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
