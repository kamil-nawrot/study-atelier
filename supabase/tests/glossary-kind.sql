\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

do $$
declare
  term uuid;
  figure uuid;
  refused boolean;
begin
  insert into public.glossary_entries (name) values ('Kampanila') returning id into term;
  assert (select kind = 'term' and category is null from public.glossary_entries where id = term),
    'an entry without a kind and a category is not a term without a category';

  insert into public.glossary_entries (name, kind) values ('Herkules', 'figure') returning id into figure;
  assert (select kind = 'figure' and category is null from public.glossary_entries where id = figure),
    'a figure cannot be added without a category';

  update public.glossary_entries set category = 'myth' where id = figure;
  update public.glossary_entries set category = null where id = figure;
  assert (select category is null from public.glossary_entries where id = figure),
    'the category of a figure cannot be chosen and cleared';

  refused := false;
  begin
    insert into public.glossary_entries (name, kind, category) values ('Zeus', 'term', 'myth');
  exception when check_violation then refused := true;
  end;
  assert refused, 'a term takes a category of a figure';

  refused := false;
  begin
    update public.glossary_entries set category = 'painting' where id = figure;
  exception when check_violation then refused := true;
  end;
  assert refused, 'a figure takes a category of a term';

  refused := false;
  begin
    insert into public.glossary_entries (name, kind) values ('Osoba', 'person');
  exception when check_violation then refused := true;
  end;
  assert refused, 'an entry takes a kind that does not exist';

  refused := false;
  begin
    update public.glossary_entries set kind = 'term' where id = figure;
  exception when insufficient_privilege then refused := true;
  end;
  assert refused, 'an entry moves between the terms and the figures';
end;
$$;

rollback;
