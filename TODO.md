- [x] Diagnose Firestore rules mismatch causing guest `list /images` permission-denied
- [x] Update Firestore rules deployment source: current `firestore.rules.new` is set to `allow read, write: if request.auth != null;` (blocks anonymous), likely deployed accidentally
- [ ] Ensure only correct rules file is deployed (avoid `firestore.rules.new` accidentally)
- [ ] Re-run app load to confirm error resolved
- [ ] Optional: add client-side guard so permission errors don’t crash layout


