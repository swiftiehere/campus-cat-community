create table if not exists public.cats (
  id text primary key,
  name text not null,
  pinyin text default 'CAMPUS CAT',
  location text not null,
  gender text default '未知',
  personality text default '待同学们继续认识',
  status text default '情况未知 · 待确认',
  note text default '这是一条由同学补充的校园猫猫档案。',
  image text,
  created_at timestamptz default now()
);

alter table public.cats enable row level security;
create policy "public can read cats" on public.cats for select using (true);
create policy "public can add cats" on public.cats for insert with check (true);
create policy "public can edit cats" on public.cats for update using (true) with check (true);
create policy "public can delete cats" on public.cats for delete using (true);

-- Create a public Storage bucket named cat-photos in the Supabase dashboard.
-- Then add Storage policies for anonymous read, insert, and update on that bucket.
