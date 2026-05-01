# Security Specification: SAMU 192 Permutas & Checklists

## 1. Data Invariants
- A `Permuta` must have a `requesterId` that matches the authenticated user who created it.
- A `Permuta` can only be updated by the `requester`, the `substitute`, or an `admin/coordenacao`.
- A `Checklist` belongs to a user and can only be read/written by that user or an `admin`.
- `config/checklist_templates_*` can only be updated by an `admin`.
- A `User` profile can only be created with a `uid` matching the auth `uid`.

## 2. The "Dirty Dozen" Payloads (Target: DENIED)

1. **Identity Spoofing**: Creating a permuta with another user's `requesterId`.
2. **Role Escalation**: Setting `role: 'coordenacao'` during user registration.
3. **Ghost Field Update**: Updating a permuta with `isVerified: true` (unauthorized field).
4. **Relationship Bypass**: Updating a permuta where you are neither requester nor substitute nor admin.
5. **State Shortcut**: Moving a permuta from `pendente_substituto` straight to `aprovada` bypassing coordination.
6. **Orphaned Record**: Creating a permuta with a non-existent `substituteId`.
7. **Resource Poisoning**: Document ID with 2KB junk characters.
8. **PII Leak**: Non-admin reading another user's private profile.
9. **Denial of Wallet**: Sending 10MB string in `reason` field.
10. **Template Sabotage**: Non-admin updating `config/checklist_templates_USA`.
11. **Temporal Fraud**: Setting `createdAt` to a future date in the past from client.
12. **Double Signature**: Substitute trying to sign as coordinator.

## 3. Test Runner (Draft)
(See `firestore.rules.test.ts` for implementation details once environment supports it)
