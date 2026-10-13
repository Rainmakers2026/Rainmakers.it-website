# 08 — Internal annotations (team review tool)

PRD §14. Lets invited team members pin comments on any page of the site (production or Vercel
preview). Annotations are stored in Supabase and are invisible to the public.

## Access model

| Who | Can |
|---|---|
| Anonymous visitor | Nothing. The tool's code is not even downloaded; annotations are never in the HTML. |
| Signed-in user **not** in `team_members` | Nothing (no session cookie is issued; RLS returns no rows). |
| Team member, role `editor` | Read all annotations, create, edit the text of **own** notes, resolve / reopen / archive any note. |
| Team member, role `admin` | Everything, including editing any note and **deleting**. |

Enforcement is in the database (`supabase/migrations/0006_site_annotations.sql`):

- RLS on `site_annotations` and `team_members`; `anon` has no privileges.
- Membership checks via `rm_is_team_member()` / `rm_is_team_admin()`.
- A trigger forces `author_id`/`author_email` from the JWT (cannot be spoofed), keeps them immutable,
  records who resolved a note, and blocks text edits on others' notes for editors.
- Nobody can add themselves to `team_members`: it is managed only from the dashboard / SQL editor.

The API routes (`/api/review/session*`, `/api/annotations*`) call Supabase with the **signed-in user's
JWT and the anon key** — never with the service key — so RLS always applies. Tokens are kept in
**httpOnly, Secure, SameSite=Lax cookies limited to `/api`**: page JavaScript cannot read them.

Sign-in is passwordless: a one-time **email code** (Supabase Auth OTP). No shared password,
no credentials in the code.

## Setup (once)

1. **Migration**: run `supabase/migrations/0006_site_annotations.sql` in the SQL editor.
2. **Policy test**: run `supabase/tests/0006_annotations_rls.sql`. It runs in a transaction that is
   rolled back, and must end with `ALL ANNOTATION RLS TESTS PASSED`.
3. **Auth settings** (Supabase → Authentication):
   - Providers → Email: enabled; **"Allow new users to sign up" = OFF** (only invited users).
   - Email templates → "Magic link" / OTP: make sure the template shows the code `{{ .Token }}`.
   - SMTP settings: configure a real SMTP sender (e.g. Brevo SMTP) — Supabase's built-in sender is
     rate-limited and meant for testing only.
4. **Invite each team member**: Authentication → Users → *Invite user* (their work email).
5. **Allow them** in the SQL editor (role `editor` or `admin`):

   ```sql
   insert into public.team_members (user_id, email, role)
   select id, email, 'editor' from auth.users where email = 'name@rainmakers.it'
   on conflict (user_id) do update set role = excluded.role;
   ```

   Remove someone: `delete from public.team_members where email = 'name@rainmakers.it';`
   (they lose access on their next request; their notes stay, with their email as author).
6. **Environment**: no new variables. Uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` (must be the anon /
   publishable key — the tool never falls back to the service key).

## Using it

1. Open any page with `?review=1` (e.g. `https://<site>/it?review=1`). The choice is remembered in a
   harmless `rm_review` cookie; `?review=0` or **Chiudi revisione** turns it off.
2. Sign in with your team email → enter the code received by email.
3. **Aggiungi nota** → click/tap the spot → write → **Salva**. A numbered pin appears.
4. The panel lists the page's notes (open / all) with author, date and status; resolve, archive,
   edit (own notes) or delete (admin).

**Anchoring**: each note stores the page (`/it`, `/en/join`…), the nearest stable section id
(`founder`, `rainforest`, `connect`…), an optional short element path inside that section and the
position as 0–1 coordinates of that element — so pins follow the content across screen sizes. If an
element disappears after a redesign, the pin falls back to its section; if the section is removed,
the note stays in the list without a pin.

## Tests

- `npm run test:annotations` — 20 route tests without network (anonymous access, forged cookies,
  cross-origin, sign-in without enumeration, non-members, user-JWT-only calls, spoofed author fields,
  RLS refusals, refresh, revocation).
- `supabase/tests/0006_annotations_rls.sql` — database policies (needs the live project).

Rollback: `supabase/rollback/0006_down.sql` (deletes all annotations — export first).
