## TODO-Fixes: Firebase Storage CORS preflight failure

- [x] Identify that upload uses Firebase Storage SDK (`src/components/admin/image-uploader.tsx`).
- [x] Check existing `firebase-cors.json` and confirm missing `OPTIONS` handling.
- [ ] Deploy updated CORS config to Firebase Storage (use `gsutil cors set firebase-cors.json gs://<your-bucket>` or Firebase CLI workflow).
- [ ] Re-test upload from `hiskywshop.vercel.app` and confirm preflight now returns HTTP 200.
- [ ] If still failing, verify bucket name/env and that CORS rules are applied to the correct Storage bucket.

