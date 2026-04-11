# Supabase Migration Order

Run these files in ascending order:

1. `001_security_cleanup.sql`
2. `002_profiles_extend.sql`
3. `003_chat_core.sql`
4. `004_availability_bookings.sql`
5. `005_reviews.sql`
6. `006_admin_support.sql`
7. `007_indexes_constraints.sql`
8. `008_rls_hardening.sql`
9. `010_conversation_closure_and_booking_completion.sql`
9. `009_feature_extensions.sql`

## Notes

- These migrations are written to be mostly idempotent (`IF NOT EXISTS`, guarded constraints/policies).
- `service_role` bypasses RLS by design; backend API writes should continue through service role.
- Client-side access is constrained by both grants and RLS policies.
