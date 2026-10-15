do $$
declare
  tester constant uuid := '00000000-0000-4000-8000-000000000001';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  )
  values (
    '00000000-0000-0000-0000-000000000000', tester, 'authenticated', 'authenticated',
    'test@example.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), tester, tester::text, 'email',
    jsonb_build_object('sub', tester::text, 'email', 'test@example.com', 'email_verified', true),
    now(), now(), now()
  );

  insert into public.artworks (
    id, owner_id, title, author_unknown, year_to, year_approximate, type_code, era_code, notes,
    source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
    source_image_attribution, image_width, image_height, deleted_at
  )
  values
    ('00000000-0000-4000-8000-000000000101', tester, 'Mona Liza', false, 1503, true,
      'painting', 'early_modern', 'Portret Lisy Gherardini, żony kupca Francesca del Giocondo.',
      'Q12418', 'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg',
      'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', 'Leonardo da Vinci',
      1060, 1540, null),
    ('00000000-0000-4000-8000-000000000102', tester, 'Gwiaździsta noc', false, 1889, false,
      'painting', 'modern', 'Widok z okna sanatorium w Saint-Rémy-de-Provence.',
      'Q45585', 'Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
      'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', 'Vincent van Gogh',
      1840, 1460, null),
    ('00000000-0000-4000-8000-000000000103', tester, 'Dziewczyna z perłą', false, 1665, true,
      'painting', 'early_modern', 'Tronie, czyli studium głowy, a nie portret konkretnej osoby.',
      'Q185372', 'Meisje_met_de_parel.jpg',
      'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', 'Johannes Vermeer',
      1170, 1350, null),
    ('00000000-0000-4000-8000-000000000104', tester, 'Wieża Eiffla', false, 1889, false,
      'architecture', 'modern', null,
      'Q243', 'Tour_Eiffel_Wikimedia_Commons.jpg',
      'Public domain', 'https://creativecommons.org/publicdomain/mark/1.0/', 'Gustave Eiffel',
      null, null, null),
    ('00000000-0000-4000-8000-000000000105', tester, 'Wielka fala w Kanagawie', false, 1831, true,
      'printmaking', 'modern', 'Pierwsza grafika z cyklu Trzydzieści sześć widoków góry Fudżi.',
      null, null, null, null, null, null, null, null),
    ('00000000-0000-4000-8000-000000000106', tester, 'Człowiek witruwiański', false, 1490, true,
      'drawing', 'early_modern', null,
      null, null, null, null, null, null, null, null),
    ('00000000-0000-4000-8000-000000000107', tester, 'Wenus z Willendorfu', true, -25000, true,
      'sculpture', 'prehistory', null,
      null, null, null, null, null, null, null, null),
    ('00000000-0000-4000-8000-000000000108', tester, 'Dawid', false, 1504, false,
      'sculpture', 'early_modern', null,
      null, null, null, null, null, null, null, now());

  insert into public.category_values (owner_id, category_code, name)
  values
    (tester, 'author', 'Leonardo da Vinci'),
    (tester, 'author', 'Vincent van Gogh'),
    (tester, 'author', 'Johannes Vermeer'),
    (tester, 'author', 'Gustave Eiffel'),
    (tester, 'author', 'Katsushika Hokusai'),
    (tester, 'author', 'Michał Anioł'),
    (tester, 'period', 'renesans'),
    (tester, 'period', 'barok'),
    (tester, 'period', 'XIX wiek'),
    (tester, 'period', 'paleolit'),
    (tester, 'style', 'wysoki renesans'),
    (tester, 'style', 'złoty wiek holenderski'),
    (tester, 'style', 'postimpresjonizm'),
    (tester, 'style', 'architektura żelazna'),
    (tester, 'style', 'ukiyo-e'),
    (tester, 'material', 'olej na desce topolowej'),
    (tester, 'material', 'olej na płótnie'),
    (tester, 'material', 'kute żelazo'),
    (tester, 'material', 'drzeworyt barwny'),
    (tester, 'material', 'tusz i pióro na papierze'),
    (tester, 'material', 'wapień oolitowy'),
    (tester, 'material', 'marmur karraryjski'),
    (tester, 'location', 'Luwr, Paryż'),
    (tester, 'location', 'MoMA, Nowy Jork'),
    (tester, 'location', 'Mauritshuis, Haga'),
    (tester, 'location', 'Paryż'),
    (tester, 'location', 'Gallerie dell''Accademia, Wenecja'),
    (tester, 'location', 'Naturhistorisches Museum, Wiedeń'),
    (tester, 'location', 'Galleria dell''Accademia, Florencja');

  insert into public.artwork_values (artwork_id, value_id, owner_id, position)
  select link.artwork_id, value.id, tester, link.position
    from (
      values
        ('00000000-0000-4000-8000-000000000101'::uuid, 'author', 'Leonardo da Vinci', 0),
        ('00000000-0000-4000-8000-000000000101', 'period', 'renesans', 0),
        ('00000000-0000-4000-8000-000000000101', 'style', 'wysoki renesans', 0),
        ('00000000-0000-4000-8000-000000000101', 'material', 'olej na desce topolowej', 0),
        ('00000000-0000-4000-8000-000000000101', 'location', 'Luwr, Paryż', 0),
        ('00000000-0000-4000-8000-000000000102', 'author', 'Vincent van Gogh', 0),
        ('00000000-0000-4000-8000-000000000102', 'period', 'XIX wiek', 0),
        ('00000000-0000-4000-8000-000000000102', 'style', 'postimpresjonizm', 0),
        ('00000000-0000-4000-8000-000000000102', 'material', 'olej na płótnie', 0),
        ('00000000-0000-4000-8000-000000000102', 'location', 'MoMA, Nowy Jork', 0),
        ('00000000-0000-4000-8000-000000000103', 'author', 'Johannes Vermeer', 0),
        ('00000000-0000-4000-8000-000000000103', 'period', 'barok', 0),
        ('00000000-0000-4000-8000-000000000103', 'style', 'złoty wiek holenderski', 0),
        ('00000000-0000-4000-8000-000000000103', 'material', 'olej na płótnie', 0),
        ('00000000-0000-4000-8000-000000000103', 'location', 'Mauritshuis, Haga', 0),
        ('00000000-0000-4000-8000-000000000104', 'author', 'Gustave Eiffel', 0),
        ('00000000-0000-4000-8000-000000000104', 'period', 'XIX wiek', 0),
        ('00000000-0000-4000-8000-000000000104', 'style', 'architektura żelazna', 0),
        ('00000000-0000-4000-8000-000000000104', 'material', 'kute żelazo', 0),
        ('00000000-0000-4000-8000-000000000104', 'location', 'Paryż', 0),
        ('00000000-0000-4000-8000-000000000105', 'author', 'Katsushika Hokusai', 0),
        ('00000000-0000-4000-8000-000000000105', 'period', 'XIX wiek', 0),
        ('00000000-0000-4000-8000-000000000105', 'style', 'ukiyo-e', 0),
        ('00000000-0000-4000-8000-000000000105', 'material', 'drzeworyt barwny', 0),
        ('00000000-0000-4000-8000-000000000106', 'author', 'Leonardo da Vinci', 0),
        ('00000000-0000-4000-8000-000000000106', 'period', 'renesans', 0),
        ('00000000-0000-4000-8000-000000000106', 'style', 'wysoki renesans', 0),
        ('00000000-0000-4000-8000-000000000106', 'material', 'tusz i pióro na papierze', 0),
        ('00000000-0000-4000-8000-000000000106', 'location', 'Gallerie dell''Accademia, Wenecja', 0),
        ('00000000-0000-4000-8000-000000000107', 'period', 'paleolit', 0),
        ('00000000-0000-4000-8000-000000000107', 'material', 'wapień oolitowy', 0),
        ('00000000-0000-4000-8000-000000000107', 'location', 'Naturhistorisches Museum, Wiedeń', 0),
        ('00000000-0000-4000-8000-000000000108', 'author', 'Michał Anioł', 0),
        ('00000000-0000-4000-8000-000000000108', 'period', 'renesans', 0),
        ('00000000-0000-4000-8000-000000000108', 'style', 'wysoki renesans', 0),
        ('00000000-0000-4000-8000-000000000108', 'material', 'marmur karraryjski', 0),
        ('00000000-0000-4000-8000-000000000108', 'location', 'Galleria dell''Accademia, Florencja', 0)
    ) as link (artwork_id, category_code, name, position)
    join public.category_values as value
      on value.owner_id = tester
      and value.category_code = link.category_code
      and value.name = link.name;

  insert into public.period_eras (value_id, era_code, owner_id)
  select value.id, link.era_code, tester
    from (
      values
        ('renesans', 'early_modern'),
        ('barok', 'early_modern'),
        ('XIX wiek', 'modern'),
        ('paleolit', 'prehistory')
    ) as link (name, era_code)
    join public.category_values as value
      on value.owner_id = tester and value.category_code = 'period' and value.name = link.name;

  insert into public.style_periods (style_id, period_id, owner_id)
  select style.id, period.id, tester
    from (
      values
        ('wysoki renesans', 'renesans'),
        ('złoty wiek holenderski', 'barok'),
        ('postimpresjonizm', 'XIX wiek'),
        ('architektura żelazna', 'XIX wiek'),
        ('ukiyo-e', 'XIX wiek')
    ) as link (style_name, period_name)
    join public.category_values as style
      on style.owner_id = tester and style.category_code = 'style' and style.name = link.style_name
    join public.category_values as period
      on period.owner_id = tester and period.category_code = 'period' and period.name = link.period_name;

  insert into public.era_details (owner_id, era_code, summary, notes)
  values (
    tester, 'early_modern',
    'Od odkrycia Ameryki do rewolucji francuskiej: renesans, barok i rokoko.',
    E'## Co rozpoznać\n\nPerspektywa linearna, światłocień, ciało ludzkie zbudowane na anatomii.'
  );

  insert into public.period_details (value_id, owner_id, summary, notes)
  select value.id, tester,
    'Odrodzenie antyku we Włoszech XV–XVI wieku: harmonia, proporcja, perspektywa.',
    E'Do sprawdzenia: gdzie kończy się **manieryzm**, a zaczyna barok?'
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'period' and value.name = 'renesans';

  insert into public.style_details (value_id, owner_id, summary)
  select value.id, tester, 'Szczyt renesansu we Florencji i Rzymie, około 1490–1527.'
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'style' and value.name = 'wysoki renesans';

  insert into public.material_details (value_id, owner_id, summary)
  select value.id, tester, 'Farba olejna na lnianym płótnie, od XVI wieku główne podobrazie malarstwa sztalugowego.'
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'material' and value.name = 'olej na płótnie';

  insert into public.author_details (value_id, owner_id, summary, notes, birth_year, death_year, sort_name)
  select value.id, tester,
    'Malarz, rzeźbiarz, inżynier i badacz natury; mistrz sfumato.',
    E'**Najważniejsze dzieła:** Mona Lisa, Ostatnia Wieczerza, Dama z gronostajem.',
    1452, 1519, 'Vinci, Leonardo da'
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'author' and value.name = 'Leonardo da Vinci';

  insert into public.author_details (value_id, owner_id, birth_year)
  select value.id, tester, 1760
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'author' and value.name = 'Katsushika Hokusai';

  insert into public.location_details (value_id, owner_id, summary, country_code, place_type)
  select value.id, tester,
    'Dawny pałac królewski w Paryżu, muzeum od 1793 roku.',
    'FR', 'museum'
    from public.category_values as value
    where value.owner_id = tester and value.category_code = 'location' and value.name = 'Luwr, Paryż';
end;
$$;
