# Security Specification & Threat Model
## Guide to the Republic of Adygea

This document covers the security constraints and threat validation cases for the Cloud Firestore database containing sights, routes, reviews, and user accounts.

---

## 1. Data Invariants

1. **User Role Lock**: Users are forbidden from self-assigning properties like `role: "admin"`. Roles must only be writable by existing admins or protected through server checks (or a dedicated bootstrap file).
2. **Review Integrity**: A user can only write reviews under their own authentication UID (`userId == request.auth.uid`).
3. **Immutability of Key Meta**:
   - `createdAt` of any document cannot be modified after initial write.
   - `createdBy` and `userId` fields representing the owner cannot be changed during updates.
4. **Strict Rating Boundaries**: Review ratings must strictly be integers between `1` and `5`.
5. **Sight & Route Modification**: Sights and routes can only be created, updated, or deleted by users holding the `admin` role. General visitors have read-only access.
6. **Temporal Validity**: All `createdAt` and `updatedAt` properties must strictly match `request.time` (Server-Assigned Timestamps).

---

## 2. The "Dirty Dozen" Payloads (Exploit Simulations)

Here are twelve critical payloads designed to testing the security bounds of the rules, which must all fail with `PERMISSION_DENIED`:

### Threat #1: Admin Role Privilege Escalation (In Users)
An authenticated user attempts to elevate their account role to "admin" during update.
- **Payload**: `patch /users/{normalUid} { role: "admin" }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #2: Ghost Profile Hijacking (Identity Spoofing)
An authenticated user `uid_A` tries to create/overwrite user profile `uid_B`.
- **Payload**: `set /users/{uid_B} { uid: "uid_B", email: "victim@test.ru", displayName: "Victim", ... }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #3: Temporal Deception (Fudging Timestamps)
A user sends a client-side timestamp 10 days in the future to keep their review pinned or falsify records.
- **Payload**: `set /reviews/{rev1} { createdAt: "2030-01-01T00:00:00Z", ... }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #4: Anonymous Sight Creation (Spamming Catalog)
An unauthenticated or standard user attempts to add a tourist sight to the catalog.
- **Payload**: `set /sights/{someSight} { title: "Spam Sight", category: "nature", createdBy: "user_123", ... }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #5: Rogue Review Generation (Review Spoofing)
User `uid_A` attempts to post a review as User `uid_B`.
- **Payload**: `set /reviews/{rev2} { userId: "uid_B", text: "Fake text", sightId: "rufabgo" }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #6: Non-Admin Sight Modification (Catalog Tampering)
A regular registered user attempts to change the geographic coordinates or descriptions of an existing sight.
- **Payload**: `patch /sights/{rufabgo} { coordinates: { lat: 0, lng: 0 } }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #7: Denial of Wallet - Extreme Size Injection
An attacker attempts to write an enormous 800KB string of junk into a short description or ID fields to deplete DB storage.
- **Payload**: `set /sights/{bad_id_extremely_long_junk_characters_spam_strings...} { ... }`
- **Expected Result**: `PERMISSION_DENIED` (Strict size and regex limit on document id path variables and fields)

### Threat #8: Score Poisoning (Review Limits Bypass)
A user tries to post a review rating of 10 stars or negative ratings.
- **Payload**: `set /reviews/{rev3} { rating: 10, ... }` or `set /reviews/{rev3} { rating: -5, ... }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #9: Out-of-Bound Field Poisoning (Ghost Fields / Schema Gaps)
An attacker attempts to write unmapped system fields (e.g. `isVerifiedPartner: true` or `vipStatus: true`) to a sight or profile.
- **Payload**: `patch /sights/{rufabgo} { ghostExtraField: "unallowed" }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #10: Route Hijacking & Ownership Spoofing
An attacker attempts to modify or delete a recommended travel route created by an admin.
- **Payload**: `delete /routes/{route_1}` (invoked by a non-admin)
- **Expected Result**: `PERMISSION_DENIED`

### Threat #11: Review Update Bypass (Modifying Ratings post-hoc)
A user attempts to alter the `userId` of a review after creation as part of an ownership-takeover update.
- **Payload**: `patch /reviews/{rev1} { userId: "other_uid" }`
- **Expected Result**: `PERMISSION_DENIED`

### Threat #12: Blanket Reading of Secure User Emails
An unauthorized visitor attempts a full query mapping user configurations to gather names and email databases.
- **Payload**: `get /users` (unfiltered access query)
- **Expected Result**: `PERMISSION_DENIED`

---

## 3. Threat Model Validation Test Specs

To test these, our rules at `firestore.rules` will perform exact checks on incoming data types, lengths, roles, and IDs. Specifically:

```javascript
// Rule schema blueprint matches
function isValidId(id) { 
  return id is string && id.size() <= 64 && id.matches('^[a-zA-Z0-9_\\-]+$'); 
}
```

Wait, we will enforce strict validations using Firestore rules. Let's write them next.
