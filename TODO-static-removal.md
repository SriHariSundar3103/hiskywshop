# Remove Static Images - Only Admin Uploads TODO

## Steps:
- [x] 1. Create TODO for static removal
- [x] 2. Edit src/context/product-context.tsx - remove seeding logic
- [x] 3. Edit src/lib/data.ts - remove static products array
- [x] 4. Delete placeholder images files
- [ ] 5. Verify admin upload works (/admin/products/new)
- [x] 6. Complete

## Status
Static data removed. Now only admin-uploaded products/images from Firestore display on site.

**Admin upload ready:**
1. Login /login (admin role)
2. /admin/products/new
3. Fill form, select images from image-selector (Firestore images collection)
4. Submit - product appears on frontend grids.

**Note:** Clear Firestore 'products'/'images' if static seeded data exists (Firebase console).

**Test:** npm run dev -- --turbo
