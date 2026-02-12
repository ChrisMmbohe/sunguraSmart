# E-Commerce Store - Quick Start Guide

## What Was Built

A complete e-commerce store integrated into the SunguraSmart application with:

✅ Product catalog with search and filters
✅ Shopping cart with persistence
✅ Stripe payment integration
✅ Order tracking and history
✅ Admin dashboard for product/order management
✅ User authentication via Clerk
✅ Analytics with PostHog
✅ Responsive design with Tailwind CSS

## Installation Steps

### 1. Install New Dependencies

```bash
npm install
```

**New packages added to package.json:**
- `stripe@^13.9.0` - Payment processing
- `@stripe/stripe-js@^3.5.0` - Stripe JavaScript library
- `@stripe/react-stripe-js@^2.7.0` - React Stripe integration
- `sonner@^1.7.2` - Toast notifications

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys (get from https://stripe.com/docs/keys)
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URL for Stripe redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Existing variables (should already be present)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SEED_API_SECRET=my-farm-dev-secret-2025
```

### 3. Set Up Stripe

1. Create a free account at [stripe.com](https://stripe.com)
2. Go to Developers → API Keys
3. Copy Test Mode keys:
   - Publishable Key → `STRIPE_PUBLIC_KEY`
   - Secret Key → `STRIPE_SECRET_KEY`
4. Set up webhook:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhook/stripe`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`
   - Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

### 4. Seed Sample Products

```bash
# Using curl
curl -X POST http://localhost:3000/api/seed/products \
  -H "x-api-secret: my-farm-dev-secret-2025" \
  -H "Content-Type: application/json"

# Or with JavaScript/Node.js
fetch('http://localhost:3000/api/seed/products', {
  method: 'POST',
  headers: {
    'x-api-secret': 'my-farm-dev-secret-2025',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

### 5. Test the Store

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000/store` to see the store!

## Quick Navigation

- **Store**: `/store` - Browse products
- **Cart**: `/store/cart` - Shopping cart
- **Checkout**: `/store/checkout` - Buy items
- **Account**: `/store/account` - Order history
- **Admin**: `/admin/dashboard` - Manage products/orders

## Testing Stripe Payments

Use these test card numbers in the Stripe checkout:

| Card Type | Number | Exp | CVC |
|-----------|--------|-----|-----|
| Visa (Success) | 4242 4242 4242 4242 | 12/25 | 123 |
| Visa (Decline) | 4000 0000 0000 0002 | 12/25 | 123 |
| Amex | 3782 822463 10005 | 12/25 | 1234 |

Any future date and any 3-4 digit CVC will work.

## Admin Setup

To make a user an admin:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select the user you want to make admin
3. Click "Metadata" or go to User Details
4. Add metadata:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save and the user can now access `/admin/dashboard`

## Key Features

### For Customers

- **Product Search**: Full-text search, category filters, price ranges
- **Product Details**: Images, descriptions, specifications, reviews
- **Shopping Cart**: Add/remove items, adjust quantities
- **Checkout**: Multi-step process with address entry
- **Stripe Payment**: Secure payment processing
- **Order Tracking**: View past orders and status

### For Admins

- **Product Management**: Add, edit, delete products
- **Order Management**: View all orders, update status
- **Analytics**: See total products, orders, and revenue
- **Status Tracking**: Manage order fulfillment

### Analytics

All major events are tracked with PostHog:
- Page views
- Product searches
- Items added to cart
- Checkout started
- Purchases completed

View analytics at [PostHog Dashboard](https://app.posthog.com)

## File Organization

**Database Models** → `database/`
- `product.model.ts` - Product schema
- `cart.model.ts` - Shopping cart
- `order.model.ts` - Orders
- `review.model.ts` - Reviews

**API Routes** → `app/api/`
- `products/` - Product CRUD
- `cart/` - Cart operations
- `orders/` - Order management
- `checkout/` - Stripe integration
- `webhook/stripe/` - Payment webhooks
- `reviews/` - Customer reviews
- `seed/products/` - Database seeding

**Frontend Pages** → `app/store/` & `app/admin/`
- Store browsing and shopping
- Checkout flow
- User account dashboard
- Admin controls

**Components** → `components/store/`
- ProductCard, ProductGrid
- StoreFilters, CartSummary
- All Radix UI components

## Important Notes

⚠️ **For Production:**
1. Replace Stripe test keys with production keys
2. Update `NEXT_PUBLIC_APP_URL` to your actual domain
3. Configure Stripe webhook for production
4. Set up email notifications (Stripe handles emails by default)
5. Review and customize shipping/tax calculations
6. Add rate limiting to API endpoints
7. Implement proper error logging

⚠️ **Database:**
- Models use existing MongoDB connection
- TTL indexes auto-clean old carts after 30 days
- All data is indexed for performance

⚠️ **Security:**
- All authenticated endpoints verify Clerk user
- Admin operations require admin role
- Seed endpoint requires API secret
- Input validation on all forms

## Troubleshooting

**Products not showing up?**
→ Run the seed endpoint to populate samples

**Stripe payment not working?**
→ Check that `STRIPE_SECRET_KEY` is set in `.env.local`
→ Verify webhook endpoint is configured in Stripe dashboard

**Can't access admin dashboard?**
→ Check that user has `admin` role in Clerk metadata
→ Clear browser cookies and log in again

**Cart not saving?**
→ User must be signed in with Clerk
→ Check browser console for errors

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Add Stripe API keys to `.env.local`
3. ✅ Set up Stripe webhook
4. ✅ Run dev server: `npm run dev`
5. ✅ Seed products: `curl http://localhost:3000/api/seed/products...`
6. ✅ Visit store: `http://localhost:3000/store`
7. ✅ Test checkout with Stripe test card
8. ✅ Make yourself admin in Clerk
9. ✅ Visit admin dashboard: `http://localhost:3000/admin/dashboard`

## Support

For detailed implementation information, see [ECOMMERCE_IMPLEMENTATION_GUIDE.md](./ECOMMERCE_IMPLEMENTATION_GUIDE.md)

**Resources:**
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Clerk Docs](https://clerk.com/docs)
- [MongoDB Docs](https://www.mongodb.com/docs)
- [PostHog Docs](https://posthog.com/docs)

---

## Summary

You now have a fully functional e-commerce store! All the hard work is done. Just add your Stripe keys, seed some products, and you're ready to start selling! 🎉
