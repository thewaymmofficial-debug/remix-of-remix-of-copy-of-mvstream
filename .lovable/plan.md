

## Fix Payment Method Selection, Screenshot Display, and Transaction ID Placeholder

### What Changes

**1. Auto-select payment method when user copies account number**
When a user taps the copy icon on a payment card (e.g., KBZ Pay), that card gets visually selected with a highlight border/ring. This selection is stored and submitted along with the premium request so the admin knows which payment method was used.

**2. Store payment method name with the request**
Add a `payment_method` column to the `premium_requests` table to record which payment method the user selected (e.g., "KBZ Pay"). This will also be displayed in the admin detail view.

**3. Fix screenshot not showing for admin**
The screenshot upload and URL storage logic looks correct in code, but the admin detail dialog already displays it if `screenshot_url` is present. The issue may be that the upload is failing silently or the `payment-screenshots` bucket RLS policies block the upload. We will add an RLS policy to allow authenticated users to upload to the `payment-screenshots` bucket.

**4. Fix Transaction ID placeholder text**
Change the placeholder from `ငွေလွှဲပြေစာမှ Transaction ID ကို...` to `ငွေလွှဲပြေစာမှ Transaction ID နံပါတ်`

---

### Technical Details

**New Migration: Add `payment_method` column to `premium_requests`**
- `ALTER TABLE premium_requests ADD COLUMN payment_method text;`
- Add storage RLS policies for `payment-screenshots` bucket to allow authenticated users to upload files.

**File: `src/pages/PremiumRenewal.tsx`**
- Add `selectedPaymentMethod` state (stores the payment method name string)
- When user clicks copy icon on a payment card, set `selectedPaymentMethod` to that method's name (and `id`)
- Add a visual selection indicator on the payment card: a ring/border highlight + checkmark when selected
- Include `payment_method` in the `submitRequest.mutateAsync()` call
- Update Transaction ID input placeholder to `ငွေလွှဲပြေစာမှ Transaction ID နံပါတ်`
- Show the uploaded screenshot as a thumbnail preview (instead of just the file name)

**File: `src/hooks/usePremiumRequests.tsx`**
- Add `payment_method` to the `PremiumRequest` interface
- Add `payment_method` to the mutation function parameter type

**File: `src/pages/admin/PremiumRequestsAdmin.tsx`**
- Display the `payment_method` field in the request card and detail dialog so admins can see which payment method was used

**File: `src/integrations/supabase/types.ts`**
- Update the `premium_requests` type to include the new `payment_method` column

