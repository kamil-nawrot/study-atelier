do $$
declare
  learner uuid := (select id from auth.users where email = 'test@example.com');
  pd constant text := 'https://creativecommons.org/publicdomain/mark/1.0/';
begin
  if learner is null then
    raise exception 'no user with this e-mail';
  end if;

  create temp table new_artworks (
    title text, author text, year_from integer, year_to integer, approximate boolean,
    type_code text, era_code text, period text, style text, material text, location text,
    wikidata text, file text, licence text, licence_url text, attribution text,
    width integer, height integer, notes text
  ) on commit drop;

  insert into new_artworks values
    ('Mona Liza', 'Leonardo da Vinci', 1503, 1519, true, 'painting', 'early_modern', 'renesans', 'wysoki renesans', 'olej na desce topolowej', 'Luwr, Paryż',
      'Q12418', 'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg', 'Public domain', pd, 'Leonardo da Vinci', 7479, 11146, 'Portret na tle fantastycznego krajobrazu, malowany techniką sfumato.'),
    ('Gwiaździsta noc', 'Vincent van Gogh', null, 1889, false, 'painting', 'modern', 'XIX wiek', 'postimpresjonizm', 'olej na płótnie', 'MoMA, Nowy Jork',
      'Q45585', 'Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', 'Public domain', pd, 'Vincent van Gogh', 44567, 35291, 'Nocne niebo nad wioską, z cyprysem na pierwszym planie.'),
    ('Dziewczyna z perłą', 'Johannes Vermeer', null, 1665, true, 'painting', 'early_modern', 'barok', 'złoty wiek holenderski', 'olej na płótnie', 'Mauritshuis, Haga',
      'Q185372', 'Meisje_met_de_parel.jpg', 'Public domain', pd, 'Johannes Vermeer', 4095, 4794, null),
    ('Wielka fala w Kanagawie', 'Katsushika Hokusai', null, 1831, true, 'printmaking', 'modern', 'XIX wiek', 'ukiyo-e', 'drzeworyt barwny', 'Metropolitan Museum of Art, Nowy Jork',
      'Q252485', 'Tsunami_by_hokusai_19th_century.jpg', 'Public domain', pd, 'Katsushika Hokusai', 3859, 2594, 'Pierwsza grafika z cyklu Trzydzieści sześć widoków góry Fudżi.'),
    ('Narodziny Wenus', 'Sandro Botticelli', 1484, 1486, true, 'painting', 'early_modern', 'renesans', 'wczesny renesans', 'tempera na płótnie', 'Galeria Uffizi, Florencja',
      'Q151047', 'Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg', 'Public domain', pd, 'Sandro Botticelli', 30000, 18840, null),
    ('Ogród rozkoszy ziemskich', 'Hieronim Bosch', 1490, 1510, true, 'painting', 'early_modern', 'renesans', 'renesans północny', 'olej na desce dębowej', 'Prado, Madryt',
      'Q321303', 'The_Garden_of_earthly_delights.jpg', 'Public domain', pd, 'Hieronim Bosch', 39137, 22279, 'Tryptyk: raj, ogród rozkoszy i piekło.'),
    ('Wieża Babel', 'Pieter Bruegel starszy', null, 1563, false, 'painting', 'early_modern', 'renesans', 'renesans północny', 'olej na desce dębowej', 'Kunsthistorisches Museum, Wiedeń',
      'Q15293656', 'Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg', 'Public domain', pd, 'Pieter Bruegel starszy', 30000, 21952, null),
    ('Panny dworskie', 'Diego Velázquez', null, 1656, false, 'painting', 'early_modern', 'barok', 'barok hiszpański', 'olej na płótnie', 'Prado, Madryt',
      'Q208758', 'Las_Meninas,_by_Diego_Velázquez,_from_Prado_in_Google_Earth.jpg', 'Public domain', pd, 'Diego Velázquez', 26065, 30000, 'Malarz sam stoi przy sztaludze po lewej stronie obrazu.'),
    ('Wędrowiec nad morzem mgły', 'Caspar David Friedrich', null, 1818, true, 'painting', 'modern', 'XIX wiek', 'romantyzm', 'olej na płótnie', 'Hamburger Kunsthalle, Hamburg',
      'Q311243', 'Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg', 'Public domain', pd, 'Caspar David Friedrich', 2327, 2980, null),
    ('Impresja, wschód słońca', 'Claude Monet', null, 1872, false, 'painting', 'modern', 'XIX wiek', 'impresjonizm', 'olej na płótnie', 'Musée Marmottan Monet, Paryż',
      'Q328523', 'Claude_Monet,_Impression,_soleil_levant.jpg', 'Public domain', pd, 'Claude Monet', 1600, 1245, 'Obraz, od którego tytułu wziął nazwę impresjonizm.'),
    ('Krzyk', 'Edvard Munch', null, 1893, false, 'painting', 'modern', 'XIX wiek', 'ekspresjonizm', 'olej, tempera i pastel na tekturze', 'Galeria Narodowa, Oslo',
      'Q18891156', 'Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg', 'Public domain', pd, 'Edvard Munch', 3223, 4000, null),
    ('Pocałunek', 'Gustav Klimt', 1907, 1908, false, 'painting', 'modern', 'XX wiek', 'secesja', 'olej i płatki złota na płótnie', 'Belweder, Wiedeń',
      'Q698487', 'Gustav_Klimt_016.jpg', 'Public domain', pd, 'Gustav Klimt', 1079, 1080, null),
    ('Myśliwi na śniegu', 'Pieter Bruegel starszy', null, 1565, false, 'painting', 'early_modern', 'renesans', 'renesans północny', 'olej na desce dębowej', 'Kunsthistorisches Museum, Wiedeń',
      'Q500985', 'Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_(Winter)_-_Google_Art_Project.jpg', 'Public domain', pd, 'Pieter Bruegel starszy', 6819, 4853, 'Zimowy obraz z cyklu pór roku.'),
    ('Wolność wiodąca lud na barykady', 'Eugène Delacroix', null, 1830, false, 'painting', 'modern', 'XIX wiek', 'romantyzm', 'olej na płótnie', 'Luwr, Paryż',
      'Q29530', 'Eugène_Delacroix_-_Le_28_Juillet._La_Liberté_guidant_le_peuple.jpg', 'Public domain', pd, 'Eugène Delacroix', 5946, 4771, null),
    ('Niedzielne popołudnie na wyspie Grande Jatte', 'Georges Seurat', 1884, 1886, false, 'painting', 'modern', 'XIX wiek', 'puentylizm', 'olej na płótnie', 'Art Institute of Chicago',
      'Q1044742', 'Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_--_1884_-_Google_Art_Project.jpg', 'Public domain', pd, 'Georges Seurat', 30000, 19970, 'Namalowany z tysięcy drobnych kropek czystego koloru.'),
    ('Kobiety zbierające kłosy', 'Jean-François Millet', null, 1857, false, 'painting', 'modern', 'XIX wiek', 'realizm', 'olej na płótnie', 'Musée d''Orsay, Paryż',
      'Q1368055', 'Jean-François_Millet_-_Gleaners_-_Google_Art_Project_2.jpg', 'Public domain', pd, 'Jean-François Millet', 5354, 4006, null),
    ('Ambasadorowie', 'Hans Holbein młodszy', null, 1533, false, 'painting', 'early_modern', 'renesans', 'renesans północny', 'olej na desce dębowej', 'National Gallery, Londyn',
      'Q1212937', 'Hans_Holbein_the_Younger_-_The_Ambassadors_-_Google_Art_Project.jpg', 'Public domain', pd, 'Hans Holbein młodszy', 30000, 29560, 'U dołu obrazu anamorfoza czaszki, widoczna dopiero pod kątem.'),
    ('Mleczarka', 'Johannes Vermeer', 1657, 1658, true, 'painting', 'early_modern', 'barok', 'złoty wiek holenderski', 'olej na płótnie', 'Rijksmuseum, Amsterdam',
      'Q167605', 'Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg', 'Public domain', pd, 'Johannes Vermeer', 4000, 4485, null),
    ('Dawid', 'Michał Anioł', 1501, 1504, false, 'sculpture', 'early_modern', 'renesans', 'wysoki renesans', 'marmur karraryjski', 'Galleria dell''Accademia, Florencja',
      'Q179900', 'Michelangelo''s_David_2015.jpg', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', 'Livioandronico2013', 2388, 3824, null),
    ('Portret małżonków Arnolfinich', 'Jan van Eyck', null, 1434, false, 'painting', 'early_modern', 'renesans', 'renesans północny', 'olej na desce dębowej', 'National Gallery, Londyn',
      'Q220859', 'Van_Eyck_-_Arnolfini_Portrait.jpg', 'Public domain', pd, 'Jan van Eyck', 4386, 6000, 'W wypukłym lustrze na ścianie odbijają się dwie postacie w drzwiach.');

  insert into public.category_values (owner_id, category_code, name)
  select distinct learner, value.category_code, value.name
    from new_artworks,
      lateral (values ('author', author), ('period', period), ('style', style), ('material', material), ('location', location))
        as value(category_code, name)
  on conflict (owner_id, category_code, lower(name)) do nothing;

  with inserted as (
    insert into public.artworks (
      owner_id, title, author_unknown, year_from, year_to, year_approximate, type_code, era_code, notes,
      source_wikidata_id, source_image_file, source_image_licence, source_image_licence_url,
      source_image_attribution, image_width, image_height
    )
    select learner, title, false, year_from, year_to, approximate, type_code, era_code, notes,
      wikidata, file, licence, licence_url, attribution, width, height
      from new_artworks
    returning id, source_image_file
  )
  insert into public.artwork_values (artwork_id, value_id, owner_id, position)
  select inserted.id, category_value.id, learner, 0
    from inserted
    join new_artworks on new_artworks.file = inserted.source_image_file
    cross join lateral (
      values ('author', author), ('period', period), ('style', style), ('material', material), ('location', location)
    ) as value(category_code, name)
    join public.category_values as category_value
      on category_value.owner_id = learner
     and category_value.category_code = value.category_code
     and lower(category_value.name) = lower(value.name);
end;
$$;
