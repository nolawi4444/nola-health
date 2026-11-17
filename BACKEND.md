# NOLA HEALTH — optional backend (Supabase) design

**Status: NOT ACTIVE.** NOLA HEALTH v2 runs entirely on the device. Nothing in this document is deployed.
Features that genuinely need a server are shown in the app as **"Requires server — not active"**:

| Feature | Works today (no server) | Needs this backend |
|---|---|---|
| Family / clinician sharing | Encrypted package (file, QR or text) protected by a passphrase | Live sharing that updates automatically |
| Revoking access | Marks the share revoked **on your phone only**. A package the other person already opened stays readable on their device | Server-side revocation that takes effect immediately |
| Share expiry | Expiry date stored inside the package and enforced when it is opened | Enforced by the database |
| Professional verification (doctor/dietitian) | Placeholder only, inputs disabled | License check by an admin + `verified` flag |
| Sync across devices | No | Yes |

## 1. Adapter interface (already in `js/share.js`)

```js
// Every sharing backend implements the same interface:
createShare({ recipient, role, cats, passphrase, expiresDays }) -> Promise<{ share, text }>
listShares()                                                    -> share[]
revokeShare(id)                                                 -> Promise<share>
openShare(text, passphrase)                                     -> Promise<payload>

NolaShare.adapters.local     // LocalPackageAdapter — the default, works offline
NolaShare.adapters.supabase  // SupabaseAdapter — stub; every call throws "requires server — not active"
```

To turn a backend on, implement `SupabaseAdapter` with `@supabase/supabase-js` and set `NolaShare.adapter = NolaShare.adapters.supabase`.
Keep the end-to-end encryption: the server stores **only ciphertext**. It never sees the passphrase or readable health data.

## 2. Requirements (owner provides)

- A Supabase project (the free tier is enough). You need its **Project URL** and **anon public key**. The anon key is safe in the client **only** because Row Level Security (RLS) is on for every table.
- Supabase Auth with email OTP or phone OTP. The `service_role` key must never ship in the app.
- A privacy policy and consent text reviewed for Ethiopian data-protection rules (Proclamation No. 1321/2024).

## 3. Schema

```sql
-- Users come from auth.users. A profile row only marks role / verification.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member','clinician','admin')),
  clinician_verified boolean not null default false,   -- only an admin can set this
  license_number text,
  license_country text default 'ET',
  created_at timestamptz default now()
);

-- One row per share. The payload is AES-GCM ciphertext made on the device (NOLA1 format).
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  recipient_id uuid references auth.users on delete cascade,   -- null until the recipient claims it
  recipient_label text,                                        -- e.g. "My daughter"
  role text not null check (role in ('family','clinician')),
  categories text[] not null,                                  -- what the owner consented to share
  ciphertext text not null,                                    -- NOLA1.<z|n>.<salt>.<iv>.<ct>
  claim_code_hash text not null,                               -- sha256 of a one-time claim code
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz default now()
);
create index on public.shares (owner_id);
create index on public.shares (recipient_id);

-- Append-only access log, so the owner can see who opened what.
create table public.share_access_log (
  id bigserial primary key,
  share_id uuid not null references public.shares on delete cascade,
  accessed_by uuid not null references auth.users,
  accessed_at timestamptz default now()
);
```

## 4. Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.shares enable row level security;
alter table public.share_access_log enable row level security;

-- profiles: you can read and update your own row, but you cannot make yourself verified or an admin
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id and role <> 'admin' and clinician_verified = false);
create policy "own profile update" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id
              and clinician_verified = (select clinician_verified from public.profiles where id = auth.uid())
              and role = (select role from public.profiles where id = auth.uid()));

-- shares: the owner has full control
create policy "owner all" on public.shares for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- recipient: read only, and only while the share is not revoked and not expired.
-- A clinician share also requires a verified clinician.
create policy "recipient read active" on public.shares for select using (
  auth.uid() = recipient_id
  and revoked_at is null
  and expires_at > now()
  and (role = 'family' or exists (select 1 from public.profiles p
                                  where p.id = auth.uid() and p.role = 'clinician' and p.clinician_verified))
);

-- access log: the recipient inserts entries for shares they can read; the owner reads the log
create policy "log insert" on public.share_access_log for insert with check (
  accessed_by = auth.uid() and exists (select 1 from public.shares s where s.id = share_id and s.recipient_id = auth.uid()
                                       and s.revoked_at is null and s.expires_at > now()));
create policy "log owner read" on public.share_access_log for select using (
  exists (select 1 from public.shares s where s.id = share_id and s.owner_id = auth.uid()));
```

Claiming a share: an RPC function, `claim_share(share_id, code)`, set to `security definer`. It checks `sha256(code) = claim_code_hash`, checks the share is not revoked or expired and that `recipient_id is null`, then sets `recipient_id = auth.uid()`. It is the only way a recipient becomes linked to a share.

**Revocation:** the owner sets `revoked_at = now()`, and RLS stops returning the row at once. The honest limit stays the same: anything the recipient already saw or copied cannot be pulled back. The app must keep telling the user this.

## 5. Clinician verification

1. The clinician signs up and enters a license number (Ethiopian Food and Drug Authority / Ministry of Health registration).
2. An **admin** checks it manually against the official registry and sets `clinician_verified = true`. Use the service role, from a server or the Supabase dashboard, never from the app.
3. The app shows a "Verified clinician" badge only when the server confirms the flag. Until then, the app's placeholder stays disabled.

## 6. Security checklist

- RLS on every table; test the policies with two separate test users.
- The server sees only ciphertext; passphrases never leave the device.
- Short expiry by default (30 days), plus a one-time claim code.
- No AI key or health data in server logs.
- Delete everything when the user deletes their account (`on delete cascade`).
- Back up your Supabase project; enable 2FA on the Supabase dashboard account.
