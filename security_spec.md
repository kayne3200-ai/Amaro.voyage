# Security Specification — AMARO.VOYAGE (Zero-Trust Firestore TDD)

## 1. Data Invariants
1. **Privilege Escalation Prevention**: No user can grant themselves `admin` privileges via `/users/{userId}` or `/admins/{adminUid}`. Admin identity is strictly verified via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or bootstrapped verified runtime owner email (`kayne3200@gmail.com` with `email_verified == true`).
2. **PII Split-Collection Isolation**: Emails, phone numbers, emergency contacts, and provider payout details live exclusively in `/users/{userId}/private/{docId}` and `/providers/{providerId}/private/{docId}` — readable ONLY by `isOwner(userId)` or `isAdmin()`.
3. **Provider Verification Gate**: Providers creating `/providers/{providerId}` MUST start with `verificationStatus == 'pending'`. Only `isAdmin()` can transition `verificationStatus` to `'verified'` or `'rejected'`.
4. **Master Gate on Subcollections**: Every operation on `/journey_folders/{folderId}/items/{itemId}` fetches `/journey_folders/$(folderId)` via `get()` to verify parent folder ownership (`ownerId == request.auth.uid`).
5. **Reservation State Machine & Terminal Locking**: Reservations in `'cancelled'` or `'refunded'` terminal states cannot be mutated by non-admins. Clients cannot forge `paymentStatus == 'succeeded'` or modify `providerPrice`/`amaroFee` after creation.
6. **Strict Timestamp & Immutable Ownership**: All `createdAt` and `updatedAt` fields must equal `request.time`. `ownerId`, `clientId`, `providerOwnerId`, and `createdAt` are immutable across updates.
7. **Reservation-Scoped Identity Vault Isolation**: Identity metadata lives in `/identity_verifications/{reservationId}` and AES-256-GCM encrypted images live in `/identity_verifications/{reservationId}/private_vault/files` (`allow list: if false`). Other providers receive `403`.
8. **Admin Zero-Raw-Image Governance**: Platform Administrators may audit `/identity_verifications/{reservationId}` metadata and `/access_logs/{logId}` and revoke/purge access, but are strictly denied `get` access to raw identity images (`403` on `/view` and `PERMISSION_DENIED` on `/private_vault/files`).
9. **Pilot Partner CRM Isolation (`/pilot_partners/{pilotId}`)**: Internal notes, negotiation grids, commercial contact PII, and convention references are strictly Admin-only (`isAdmin()` for single-doc, `isBootstrappedAdmin()` for zero-lookup list). An identified prospect can never be set to `convention_signed` or `pilot_activated` without `conventionSigned == true` and a non-empty `conventionSignedRef`.
10. **Confirmed Stock & Atomic Anti-Double-Booking (`/pilot_stocks/{stockId}`)**: `bookedUnits` must satisfy `0 <= bookedUnits <= totalUnits`. Non-admin travelers can only mutate `bookedUnits` and `lastReservationId` atomically (`getAfter`) alongside their own `/reservations/$(lastReservationId)` tied to `allocatedStockId == stockId`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Self-Admin Injection**: Authenticated user writes `{ uid: "attacker", roleLevel: "super_admin", createdAt: SERVER_TIMESTAMP }` to `/admins/attacker`.
2. **Shadow Field Injection**: Owner updates `/users/{uid}` adding `"isAdmin": true` alongside valid fields.
3. **Unverified Admin Email Spoof**: Attacker with `email == "kayne3200@gmail.com"` and `email_verified == false` attempts to read `/audit_logs/log1`.
4. **Cross-User PII Harvest**: Authenticated user `userB` performs `get` on `/users/userA/private/info`.
5. **Cross-Provider Commercial Spy**: Provider `provB` performs `get` on `/providers/provA/private/commercial`.
6. **Self-Verified Provider Bypass**: Provider creates `/providers/prov1` with `verificationStatus: "verified"`.
7. **Orphaned Journey Item Write**: User writes to `/journey_folders/nonExistentFolder/items/item1` where parent folder does not belong to `request.auth.uid`.
8. **Blanket Reservation Scraping**: Authenticated user queries `collection(db, 'reservations')` without filtering by `clientId == auth.uid` or `providerOwnerId == auth.uid`.
9. **Terminal Reservation Resurrection**: Client updates a `'cancelled'` reservation back to `'confirmed'`.
10. **Client Fee Tampering**: Client updates `amaroFee: 0` and `totalAmount: 100` on an existing `/reservations/res1`.
11. **Denial-of-Wallet 1MB String Poisoning**: User creates `/cultural_stories/s1` with a 50,000-character `story` field or 500-character document ID.
12. **Client Timestamp Forgery**: User creates `/journey_folders/f1` with backdated `createdAt: Timestamp(2020, 1, 1)` instead of `request.time`.
