create or replace function public.search_key(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    replace(
      regexp_replace(
        normalize(lower(value), nfd),
        '[̀-ͯ᪰-᫿᷀-᷿⃐-⃿︠-︯]', '', 'g'
      ),
      'ł', 'l'
    ),
    '[[:space:]\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+', ' ', 'g'
  ));
$$;

reindex index public.artworks_title_key_idx;

grant execute on function public.search_key(text) to service_role;
