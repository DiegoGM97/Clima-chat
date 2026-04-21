-- Run this in Supabase SQL Editor
-- Creates persistent city-based chat tables and image storage bucket.

create extension if not exists pgcrypto;

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  constraint chat_messages_content_or_image_check
    check (coalesce(length(trim(content)), 0) > 0 or image_url is not null)
);

create index if not exists chat_messages_room_created_idx
on public.chat_messages (room_id, created_at);

alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

create policy "Authenticated users can read chat rooms"
on public.chat_rooms
for select
to authenticated
using (true);

create policy "Authenticated users can create chat rooms"
on public.chat_rooms
for insert
to authenticated
with check (true);

create policy "Authenticated users can read chat messages"
on public.chat_messages
for select
to authenticated
using (true);

create policy "Users can insert own chat messages"
on public.chat_messages
for insert
to authenticated
with check (auth.uid() = user_id);

-- Storage bucket for chat image sharing
insert into storage.buckets (id, name, public)
values ('climate-chat-images', 'climate-chat-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload chat images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'climate-chat-images');

create policy "Anyone can view chat images"
on storage.objects
for select
to public
using (bucket_id = 'climate-chat-images');
