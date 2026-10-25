export const SUPABASE_URL = 'https://abcd.supabase.co';
export const IMAGE_HOST = 'https://images.mock.test';

const COMMONS_SIZES = {
	'Mona_Lisa.jpg': [4, 6],
	'The_Starry_Night.jpg': [4000, 3200],
	'Girl_with_a_Pearl_Earring.jpg': [4, 5],
	'Portrait_of_Leonardo.jpg': [3, 4],
	'Self-portrait_in_red_chalk.jpg': [2, 3]
};

const PALETTE = [
	['#7a5c3e', '#d9c3a0'],
	['#2f4858', '#86a8b8'],
	['#6b2d3c', '#e0a1a8'],
	['#3d5a40', '#b9cfa3'],
	['#4a3f6b', '#b5a7e0'],
	['#8a6a1f', '#ecd48f']
];

export function commonsSize(file) {
	return COMMONS_SIZES[file] ?? [4, 5];
}

export function imageSvg(seed, width = 4, height = 5) {
	let hash = 0;
	for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	const [dark, light] = PALETTE[hash % PALETTE.length];
	const scale = width >= 100 ? 1 : 100;
	const w = width * scale;
	const h = height * scale;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.62}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.18}" fill="${light}" fill-opacity="0.55"/></svg>`;
}

function extraImage() {
	return {
		source_wikidata_id: null,
		source_image_file: null,
		source_image_licence: null,
		source_image_licence_url: null,
		source_image_attribution: null,
		own_image_path: null,
		own_image_url: null,
		image_width: null,
		image_height: null
	};
}

function ownImage(number, width, height) {
	return {
		own_image_url: `${IMAGE_HOST}/own-${number}-${width}x${height}.svg`,
		image_width: width,
		image_height: height
	};
}

function commonsImage(file) {
	const [width, height] = commonsSize(file);
	return {
		source_wikidata_id: 'Q1',
		source_image_file: file,
		source_image_licence: 'Public domain',
		source_image_licence_url: 'https://example.com/licence',
		source_image_attribution: 'Example Artist',
		image_width: width,
		image_height: height
	};
}

const IMAGE_KEYS = [
	'source_wikidata_id',
	'source_image_file',
	'source_image_licence',
	'source_image_licence_url',
	'source_image_attribution',
	'own_image_path',
	'own_image_url',
	'image_width',
	'image_height'
];

function artwork(number, title, authors, year, era, extra = {}) {
	const { artwork_images: others = [], ...fields } = extra;
	const main = Object.fromEntries(
		Object.entries(fields).filter(([key]) => IMAGE_KEYS.includes(key))
	);
	const rest = Object.fromEntries(
		Object.entries(fields).filter(([key]) => !IMAGE_KEYS.includes(key))
	);
	const imageId = (position) =>
		`00000000-0000-4000-9000-${String(number).padStart(9, '0')}${String(position).padStart(3, '0')}`;
	const images = [
		...(Object.keys(main).length > 0 ? [{ position: 0, ...extraImage(), ...main }] : []),
		...others
	].map((image) => ({ id: imageId(image.position), ...image }));
	return {
		id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
		record_number: number,
		title,
		year_from: null,
		year_to: year,
		year_approximate: false,
		era_code: era,
		author_unknown: false,
		type_code: 'painting',
		notes: null,
		favourite: false,
		deleted_at: null,
		artwork_values: authors.map((name, position) => ({
			position,
			category_values: { category_code: 'author', name }
		})),
		artwork_images: images,
		...rest
	};
}

function withValues(row, category, names) {
	const start = row.artwork_values.length;
	row.artwork_values.push(
		...names.map((name, index) => ({
			position: start + index,
			category_values: { category_code: category, name }
		}))
	);
	return row;
}

export const ARTWORKS = [
	withValues(
		withValues(
			withValues(
				withValues(
					withValues(
						artwork(1, 'Mona Lisa', ['Leonardo da Vinci'], 1503, 'early_modern', {
							...commonsImage('Mona_Lisa.jpg'),
							year_approximate: true,
							notes:
								'Sample note about the sfumato technique, see [Leonardo da Vinci](/atelier/values/author/author-leonardo-da-vinci) and compare [#0009 The Birth of Venus](/atelier/9).',
							artwork_field_entries: [
								{
									field_id: '00000000-0000-4000-8000-000000000403',
									text_value: 'Gombrich, s. 300'
								},
								{ field_id: '00000000-0000-4000-8000-000000000404', text_value: null }
							]
						}),
						'period',
						['Renaissance']
					),
					'style',
					['High Renaissance']
				),
				'material',
				['Oil on poplar']
			),
			'location',
			['Louvre']
		),
		'00000000-0000-4000-8000-000000000402',
		['portret', 'pejzaż']
	),
	artwork(2, 'The Starry Night', ['Vincent van Gogh'], 1889, 'modern', {
		...commonsImage('The_Starry_Night.jpg')
	}),
	withValues(
		artwork(3, 'Girl with a Pearl Earring', ['Johannes Vermeer'], 1665, 'early_modern', {
			...commonsImage('Girl_with_a_Pearl_Earring.jpg')
		}),
		'period',
		['Baroque']
	),
	artwork(4, 'Venus of Willendorf', ['Unknown'], -28000, 'prehistory', {
		...ownImage(4, 3, 4),
		type_code: 'sculpture'
	}),
	artwork(5, 'Bust of Nefertiti', ['Thutmose'], -1345, 'antiquity', {
		...ownImage(5, 4, 5),
		type_code: 'sculpture'
	}),
	artwork(6, 'Notre-Dame de Paris', ['Maurice de Sully', 'Jean de Chelles'], 1345, 'middle_ages', {
		...ownImage(6, 5, 4),
		year_from: 1163,
		type_code: 'architecture',
		artwork_images: [
			{ position: 1, ...extraImage(), ...ownImage(61, 3, 4) },
			{ position: 2, ...extraImage(), ...ownImage(62, 4, 3) }
		]
	}),
	artwork(7, 'The Kiss', ['Gustav Klimt'], 1908, 'modern', { ...ownImage(7, 1, 1) }),
	artwork(8, 'Campbell’s Soup Cans', ['Andy Warhol'], 1962, 'contemporary', {
		...ownImage(8, 4, 3)
	}),
	withValues(
		artwork(9, 'The Birth of Venus', ['Sandro Botticelli'], 1485, 'early_modern', {
			...ownImage(9, 3, 2)
		}),
		'period',
		['Renaissance']
	),
	artwork(10, 'Untitled study', ['Learner Example'], null, null, {})
];

const STUDY_SET = [
	[12, 'The Night Watch', 'Rembrandt', 1642, 'Baroque', 'Dutch Golden Age', [5, 4]],
	[13, 'Las Meninas', 'Diego Velázquez', 1656, 'Baroque', 'Spanish Golden Age', [6, 7]],
	[14, 'The Milkmaid', 'Johannes Vermeer', 1658, 'Baroque', 'Dutch Golden Age', [4, 5]],
	[
		15,
		'The Anatomy Lesson of Dr Nicolaes Tulp',
		'Rembrandt',
		1632,
		'Baroque',
		'Dutch Golden Age',
		[4, 3]
	],
	[16, 'Judith Beheading Holofernes', 'Caravaggio', 1599, 'Baroque', 'Caravaggism', [4, 3]],
	[17, 'The Last Supper', 'Leonardo da Vinci', 1498, 'Renaissance', 'High Renaissance', [2, 1]],
	[18, 'The School of Athens', 'Raphael', 1511, 'Renaissance', 'High Renaissance', [3, 2]],
	[19, 'Primavera', 'Sandro Botticelli', 1482, 'Renaissance', 'Early Renaissance', [3, 2]],
	[
		20,
		'The Arnolfini Portrait',
		'Jan van Eyck',
		1434,
		'Renaissance',
		'Early Netherlandish',
		[3, 4]
	],
	[21, 'Ginevra de’ Benci', 'Leonardo da Vinci', 1476, 'Renaissance', 'Early Renaissance', [1, 1]],
	[22, 'Impression, Sunrise', 'Claude Monet', 1872, 'Impressionism', 'Impressionism', [4, 3]],
	[
		23,
		'Luncheon of the Boating Party',
		'Pierre-Auguste Renoir',
		1881,
		'Impressionism',
		'Impressionism',
		[4, 3]
	],
	[24, 'Water Lilies', 'Claude Monet', 1906, 'Impressionism', 'Impressionism', [1, 1]],
	[25, 'The Dance Class', 'Edgar Degas', 1874, 'Impressionism', 'Impressionism', [6, 7]]
];

for (const [number, title, author, year, period, style, [width, height]] of STUDY_SET) {
	const era = year < 1789 ? 'early_modern' : 'modern';
	ARTWORKS.push(
		withValues(
			withValues(
				artwork(number, title, [author], year, era, ownImage(number, width, height)),
				'period',
				[period]
			),
			'style',
			[style]
		)
	);
}

const DAY = 24 * 60 * 60 * 1000;

function reviewCard(number, dueInDays, stability, state, lapses = 0) {
	const now = Date.now();
	return {
		artwork_id: ARTWORKS.find((row) => row.record_number === number).id,
		due: new Date(now + dueInDays * DAY).toISOString(),
		stability,
		difficulty: 5,
		state,
		reps: 3 + lapses,
		lapses,
		scheduled_days: Math.max(0, Math.round(stability)),
		learning_steps: 0,
		last_review: new Date(now - (lapses > 0 ? 1 : 6) * DAY).toISOString()
	};
}

export const REVIEW_CARDS = [
	reviewCard(1, -1, 4, 2),
	reviewCard(2, 9, 21, 2),
	reviewCard(3, -2, 3, 3, 1),
	reviewCard(4, 15, 30, 2),
	reviewCard(5, 4, 12, 2),
	reviewCard(6, 0, 2, 2),
	reviewCard(7, 20, 40, 2),
	reviewCard(9, -1, 5, 2),
	reviewCard(12, 0, 1, 3, 2),
	reviewCard(13, 6, 10, 2),
	reviewCard(14, -3, 2, 3, 1),
	reviewCard(15, 0, 3, 2),
	reviewCard(16, 12, 25, 2),
	reviewCard(17, 0, 6, 2),
	reviewCard(18, 8, 14, 2),
	reviewCard(20, -1, 1, 3, 1)
];

for (const number of [1, 3, 4, 7])
	ARTWORKS.find((row) => row.record_number === number).favourite = true;

export const TRASHED = [
	artwork(11, 'Discarded sketch', ['Learner Example'], 2020, 'contemporary', {
		...ownImage(11, 4, 5),
		deleted_at: '2026-01-01T10:00:00Z'
	})
];

export function valueId(category, name) {
	return `${category}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export const VALUE_USAGE = [
	...new Map(
		ARTWORKS.flatMap((row) =>
			row.artwork_values.map(({ category_values: value }) => [
				valueId(value.category_code, value.name),
				{ id: valueId(value.category_code, value.name), ...value }
			])
		)
	).values()
].map((value) => ({
	...value,
	artwork_count: ARTWORKS.filter((row) =>
		row.artwork_values.some(
			({ category_values: used }) =>
				used.category_code === value.category_code && used.name === value.name
		)
	).length
}));

function firstValue(row, category) {
	return row.artwork_values.find(({ category_values: value }) => value.category_code === category)
		?.category_values;
}

function usage(pairs) {
	const counts = new Map();
	for (const pair of pairs) {
		const key = JSON.stringify(pair);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts].map(([key, artwork_count]) => ({ ...JSON.parse(key), artwork_count }));
}

export const PERIOD_ERA_USAGE = usage(
	ARTWORKS.flatMap((row) => {
		const period = firstValue(row, 'period');
		return period && row.era_code
			? [{ period_id: valueId('period', period.name), era_code: row.era_code }]
			: [];
	})
);

export const STYLE_PERIOD_USAGE = usage(
	ARTWORKS.flatMap((row) => {
		const period = firstValue(row, 'period');
		const style = firstValue(row, 'style');
		return period && style
			? [{ style_id: valueId('style', style.name), period_id: valueId('period', period.name) }]
			: [];
	})
);

export const VALUE_DETAILS = {
	era_details: [
		{
			era_code: 'early_modern',
			summary:
				'From the discovery of America to the French Revolution: the Renaissance, the Baroque and the Rococo.',
			notes: '### What to look for\n\nLinear perspective, chiaroscuro and bodies built on anatomy.'
		}
	],
	author_details: [
		{ value_id: valueId('author', 'Andy Warhol'), sort_name: 'Warhol, Andy' },
		{ value_id: valueId('author', 'Gustav Klimt'), sort_name: 'Klimt, Gustav' },
		{ value_id: valueId('author', 'Vincent van Gogh'), sort_name: 'Gogh, Vincent van' },
		{
			value_id: valueId('author', 'Leonardo da Vinci'),
			summary: 'Painter, sculptor, engineer and student of nature; the master of sfumato.',
			notes: '**Key works:** Mona Lisa, The Last Supper, Lady with an Ermine.',
			birth_year: 1452,
			death_year: 1519,
			years_approximate: false,
			sort_name: 'Vinci, Leonardo da',
			...commonsImage('Portrait_of_Leonardo.jpg')
		}
	],
	location_details: [
		{
			value_id: valueId('location', 'Louvre'),
			summary: 'A former royal palace in Paris, a museum since 1793.',
			notes: null,
			country_code: 'FR',
			place_type: 'museum'
		}
	],
	period_details: [
		{
			value_id: valueId('period', 'Renaissance'),
			summary: 'The revival of antiquity in Italy: harmony, proportion and perspective.',
			notes:
				'To check: where does **Mannerism** end and the Baroque begin? Start with [#0009 The Birth of Venus](/atelier/9).'
		}
	]
};

export const CATALOGUE_MUSEUMS = [
	{ name: 'Luwr', english_name: 'Louvre Museum', country_code: 'FR' },
	{ name: 'Prado', english_name: 'Museo del Prado', country_code: 'ES' },
	{ name: 'Galeria Uffizi', english_name: 'Uffizi Gallery', country_code: 'IT' },
	{ name: 'Muzeum Brytyjskie', english_name: 'British Museum', country_code: 'GB' },
	{ name: 'Rijksmuseum', english_name: null, country_code: 'NL' },
	{
		name: 'Muzeum Narodowe w Warszawie',
		english_name: 'National Museum in Warsaw',
		country_code: 'PL'
	},
	{ name: 'Pradla Museum', english_name: null, country_code: 'PL' }
];

export const ARTWORK_SEARCH = [
	{
		item: 'http://www.wikidata.org/entity/Q167605',
		title: 'The Milkmaid',
		file: 'http://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg',
		date: '1658-01-01T00:00:00Z/9',
		creators: 'Johannes Vermeer',
		creatorNames: 'Johannes Vermeer',
		creatorCount: '1',
		order: '0'
	}
];

export const PEOPLE = [
	{
		item: 'http://www.wikidata.org/entity/Q762',
		name: 'Leonardo da Vinci',
		file: 'http://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_Leonardo.jpg',
		born: '1452-04-15T00:00:00Z/11',
		died: '1519-05-02T00:00:00Z/11'
	},
	{
		item: 'http://www.wikidata.org/entity/Q2',
		name: 'Leonardo da Vinci (self-portrait)',
		file: 'http://commons.wikimedia.org/wiki/Special:FilePath/Self-portrait_in_red_chalk.jpg',
		born: '1452-01-01T00:00:00Z/9',
		died: '1519-01-01T00:00:00Z/9'
	}
];

export const USER = {
	id: '11111111-1111-4111-8111-111111111111',
	aud: 'authenticated',
	role: 'authenticated',
	email: 'learner@example.com',
	app_metadata: {},
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
};

export const PROFILE = {
	display_name: 'Anna',
	avatar_path: null,
	review_session_size: 20,
	review_new_per_day: 10,
	review_form: 'mixed',
	review_quiz_kinds: ['quiz_title', 'quiz_image', 'quiz_style', 'quiz_pin'],
	review_free: true,
	view_show_pins: false,
	view_loupe_on: false,
	fetch_image: true,
	fetch_definition: true,
	fetch_forms: true,
	fetch_event: true
};

export function fakeSession() {
	return {
		access_token: 'fake-access-token',
		refresh_token: 'fake-refresh-token',
		token_type: 'bearer',
		expires_in: 3600,
		expires_at: Math.floor(Date.now() / 1000) + 24 * 3600,
		user: USER
	};
}

function glossaryEntry(
	number,
	name,
	category,
	definition,
	forms = [],
	article = null,
	{ synonyms = [], sortName = null } = {}
) {
	return {
		id: `00000000-0000-4000-9000-${String(number).padStart(12, '0')}`,
		owner_id: USER.id,
		name,
		category,
		definition,
		synonyms,
		forms,
		sort_name: sortName,
		source_title: article,
		source_url: article ? `https://pl.wikipedia.org/wiki/${encodeURIComponent(article)}` : null,
		source_licence: article ? 'CC BY-SA 4.0' : null,
		source_fetched_on: article ? '2026-10-17' : null,
		created_at: '2026-10-17T06:00:00Z',
		updated_at: '2026-10-17T06:00:00Z'
	};
}

function visit(number, place, placeType, countryCode, visitedOn, precision, notes, numbers) {
	return {
		id: `00000000-0000-4000-8000-000000000${String(500 + number)}`,
		visited_on: visitedOn,
		date_precision: precision,
		notes,
		category_values: {
			name: place,
			location_details: placeType ? [{ place_type: placeType, country_code: countryCode }] : []
		},
		visit_artworks: numbers.map((artworkNumber) => ({
			artwork_id: `00000000-0000-4000-8000-${String(artworkNumber).padStart(12, '0')}`
		}))
	};
}

export const VISITS = [
	visit(
		1,
		'Louvre',
		'museum',
		'FR',
		'2026-10-12',
		'day',
		'Tłum przed [#0001 Mona Lisa](/atelier/1), ale warto było podejść bliżej. Skrzydło Richelieu prawie puste, a w salach holenderskich spokój i światło z okien.',
		[1, 3, 9, 6, 7]
	),
	visit(
		2,
		'Notre-Dame de Paris',
		'on_site',
		'FR',
		'2026-08-01',
		'month',
		'Po rekonstrukcji: rozeta południowa i nowa sygnaturka.',
		[6]
	),
	visit(3, 'Belvedere', 'museum', 'AT', '2026-03-07', 'day', null, []),
	visit(
		4,
		'Uffizi',
		'museum',
		'IT',
		'2019-01-01',
		'year',
		'Pierwsza wizyta we Florencji, prawie nic nie pamiętam poza Botticellim.',
		[9]
	)
];

export const TIMELINE_EVENTS = [
	{
		id: '00000000-0000-4000-8000-000000000301',
		owner_id: USER.id,
		name: 'Odkrycie Ameryki',
		year_from: null,
		year_to: 1492,
		year_approximate: false,
		description: 'Wyprawa Kolumba dociera do wysp karaibskich.',
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000302',
		owner_id: USER.id,
		name: 'Wystąpienie Lutra',
		year_from: null,
		year_to: 1517,
		year_approximate: false,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000303',
		owner_id: USER.id,
		name: 'Sobór trydencki',
		year_from: 1545,
		year_to: 1563,
		year_approximate: false,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000304',
		owner_id: USER.id,
		name: 'Wojna trzydziestoletnia',
		year_from: 1618,
		year_to: 1648,
		year_approximate: false,
		description: 'Wojna religijna i polityczna w Europie Środkowej.',
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000305',
		owner_id: USER.id,
		name: 'Odsiecz wiedeńska',
		year_from: null,
		year_to: 1683,
		year_approximate: false,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000306',
		owner_id: USER.id,
		name: 'Rewolucja przemysłowa',
		year_from: 1760,
		year_to: 1840,
		year_approximate: true,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000307',
		owner_id: USER.id,
		name: 'Rewolucja francuska',
		year_from: 1789,
		year_to: 1799,
		year_approximate: false,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	},
	{
		id: '00000000-0000-4000-8000-000000000308',
		owner_id: USER.id,
		name: 'Wojny napoleońskie',
		year_from: 1803,
		year_to: 1815,
		year_approximate: false,
		description: null,
		created_at: '2026-10-20T00:00:00Z',
		updated_at: '2026-10-20T00:00:00Z'
	}
];

export const GLOSSARY_ENTRIES = [
	glossaryEntry(
		1,
		'Abakus',
		'architecture',
		'Kwadratowa płyta na szczycie głowicy kolumny, na której opiera się belkowanie.',
		['abakusa'],
		'Abakus (architektura)'
	),
	glossaryEntry(
		2,
		'Apsyda',
		'architecture',
		'Półkolista lub wieloboczna część budowli zamykająca nawę, zwykle od wschodu.',
		['apsydy', 'apsydzie'],
		'Apsyda'
	),
	glossaryEntry(
		3,
		'Chiaroscuro',
		'painting',
		'Budowanie bryły i nastroju silnym kontrastem światła i cienia.',
		[],
		'Chiaroscuro',
		{ synonyms: ['światłocień'] }
	),
	glossaryEntry(
		4,
		'Contrapposto',
		'sculpture',
		'Ułożenie postaci z ciężarem ciała na jednej nodze, przez co biodra i barki ustawiają się przeciwnie.',
		[],
		'Contrapposto'
	),
	glossaryEntry(
		5,
		'Fresk',
		'technique',
		'Malowanie farbami wodnymi na świeżym, mokrym tynku, z którym barwnik trwale się wiąże.',
		['fresku', 'freski'],
		'Fresk'
	),
	glossaryEntry(
		6,
		'Giorgio Vasari',
		'person',
		'Włoski malarz, architekt i pisarz, autor „Żywotów najsławniejszych malarzy, rzeźbiarzy i architektów”.',
		[],
		'Giorgio Vasari',
		{ sortName: 'Vasari, Giorgio' }
	),
	glossaryEntry(
		7,
		'Sfumato',
		'technique',
		'Technika malarska polegająca na miękkim, zamglonym przechodzeniu jednych barw w drugie.',
		['sfumata'],
		'Sfumato'
	),
	glossaryEntry(
		8,
		'Tympanon',
		'architecture',
		'Trójkątne lub półkoliste pole ściany nad wejściem albo w szczycie budowli, ograniczone gzymsem lub łukiem. W architekturze antycznej wypełniało szczyt świątyni, w romańskiej i gotyckiej zdobi portale kościołów, najczęściej płaskorzeźbą z Chrystusem w majestacie albo Sądem Ostatecznym.',
		['tympanonu', 'tympanonie', 'tympanonem', 'tympany', 'tympanonów'],
		'Tympanon',
		{ synonyms: ['tympan'] }
	),
	glossaryEntry(
		9,
		'Wanitas',
		'general',
		'Motyw w sztuce przypominający o przemijaniu i marności życia, często czaszka, zgaszona świeca albo przekwitający kwiat.',
		[],
		null
	),
	...[
		['Akwarela', 'technique'],
		['Barok', 'general'],
		['Cornice', 'architecture'],
		['Diptyk', 'painting'],
		['Filar', 'architecture'],
		['Gotyk', 'general'],
		['Impasto', 'technique'],
		['Kariatyda', 'sculpture'],
		['Lawowanie', 'technique'],
		['Mozaika', 'general'],
		['Nawa', 'architecture'],
		['Pastel', 'technique']
	].map(([name, category], index) =>
		glossaryEntry(
			10 + index,
			name,
			category,
			`${name}: krótka definicja do zrzutów ekranu.`,
			name === 'Nawa' ? ['nawy', 'nawie', 'nawę', 'nawą'] : []
		)
	)
];

const ARTICLE = (pageid, title, extract, keywords, item = null) => ({
	pageid,
	title,
	extract,
	keywords,
	fullurl: `https://pl.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
	pageprops: item ? { wikibase_item: item } : {}
});

export const WIKIPEDIA_PAGES = [
	ARTICLE(
		101,
		'Nawa',
		'Podłużna część wnętrza kościoła, ograniczona rzędami filarów lub kolumn albo ścianami. Kościół może mieć jedną nawę albo kilka: wyższą nawę główną i niższe nawy boczne, jak w bazylice.',
		['nawa']
	),
	ARTICLE(
		102,
		'Transept',
		'Nawa poprzeczna, która przecina nawę główną i tworzy plan krzyża łacińskiego.',
		['nawa', 'transept']
	),
	ARTICLE(
		103,
		'Bazylika (architektura)',
		'Budowla z wyższą nawą główną oświetloną oknami ponad nawami bocznymi.',
		['nawa', 'bazylika']
	),
	ARTICLE(
		104,
		'Kościół halowy',
		'Kościół, w którym wszystkie nawy mają tę samą lub podobną wysokość.',
		['nawa', 'halowy']
	),
	ARTICLE(
		105,
		'Łuk (architektura)',
		'Element konstrukcyjny przekrywający otwór w murze, zbudowany z klinowych elementów.',
		['łuk']
	),
	ARTICLE(
		106,
		'Dawid (Michał Anioł)',
		'Marmurowa rzeźba Michała Anioła z lat 1501–1504, przedstawiająca biblijnego Dawida.',
		['dawid'],
		'Q1001'
	),
	ARTICLE(
		107,
		'Dawid (król Izraela)',
		'Drugi król zjednoczonego Izraela, według Biblii pokonał Goliata.',
		['dawid'],
		'Q1002'
	),
	ARTICLE(
		108,
		'Sfumato',
		'Technika malarska polegająca na miękkim, zamglonym przechodzeniu jednych barw w drugie.',
		['sfumato']
	),
	ARTICLE(
		109,
		'Potop szwedzki',
		'Najazd Szwecji na Rzeczpospolitą w latach 1655–1660, w czasie II wojny północnej.',
		['potop'],
		'Q1009'
	),
	ARTICLE(
		110,
		'Potop (powieść)',
		'Powieść historyczna Henryka Sienkiewicza z lat 1884–1886, druga część Trylogii.',
		['potop'],
		'Q1010'
	)
];

export const WIKIDATA_HUMANS = ['Q1002'];

const WIKIDATA_TIME = (time, precision = 9) => [
	{ rank: 'normal', mainsnak: { datavalue: { value: { time, precision } } } }
];

export const WIKIDATA_DATES = {
	Q1009: {
		P580: WIKIDATA_TIME('+1655-07-00T00:00:00Z'),
		P582: WIKIDATA_TIME('+1660-05-03T00:00:00Z', 11)
	},
	Q1010: {
		P577: WIKIDATA_TIME('+1886-00-00T00:00:00Z'),
		P585: WIKIDATA_TIME('+1886-00-00T00:00:00Z')
	}
};

const WIKTIONARY_CASES = [
	'Mianownik',
	'Dopełniacz',
	'Celownik',
	'Biernik',
	'Narzędnik',
	'Miejscownik',
	'Wołacz'
];

function wiktionaryNoun(title, gender, singular, plural) {
	const rows = WIKTIONARY_CASES.flatMap((name, index) => [
		`|${name} lp = ${singular[index]}`,
		`|${name} lm = ${plural[index]}`
	]);
	return [
		`== ${title} ({{język polski}}) ==`,
		`''rzeczownik, rodzaj ${gender}''`,
		'{{odmiana}}',
		': (1.1) {{odmiana-rzeczownik-polski',
		...rows,
		'}}'
	].join('\n');
}

export const WIKTIONARY_PAGES = {
	nawa: wiktionaryNoun(
		'nawa',
		'żeński',
		['nawa', 'nawy', 'nawie', 'nawę', 'nawą', 'nawie', 'nawo'],
		['nawy', 'naw', 'nawom', 'nawy', 'nawami', 'nawach', 'nawy']
	),
	sklepienie: wiktionaryNoun(
		'sklepienie',
		'nijaki',
		[
			'sklepienie',
			'sklepienia',
			'sklepieniu',
			'sklepienie',
			'sklepieniem',
			'sklepieniu',
			'sklepienie'
		],
		[
			'sklepienia',
			'sklepień',
			'sklepieniom',
			'sklepienia',
			'sklepieniami',
			'sklepieniach',
			'sklepienia'
		]
	),
	krzyżowy:
		"== krzyżowy ({{język polski}}) ==\n''przymiotnik''\n{{odmiana}}\n: (1.1) {{odmiana-przymiotnik-polski}}"
};

const ADJECTIVE_ROWS = [
	[
		'mianownik',
		'<td colspan="2">krzyżowy</td><td>krzyżowa</td><td>krzyżowe</td><td>krzyżowi</td><td>krzyżowe</td>'
	],
	[
		'dopełniacz',
		'<td colspan="2">krzyżowego</td><td>krzyżowej</td><td>krzyżowego</td><td colspan="2">krzyżowych</td>'
	],
	[
		'celownik',
		'<td colspan="2">krzyżowemu</td><td>krzyżowej</td><td>krzyżowemu</td><td colspan="2">krzyżowym</td>'
	],
	[
		'biernik',
		'<td>krzyżowego</td><td>krzyżowy</td><td>krzyżową</td><td>krzyżowe</td><td>krzyżowych</td><td>krzyżowe</td>'
	],
	[
		'narzędnik',
		'<td colspan="2">krzyżowym</td><td>krzyżową</td><td>krzyżowym</td><td colspan="2">krzyżowymi</td>'
	],
	[
		'miejscownik',
		'<td colspan="2">krzyżowym</td><td>krzyżowej</td><td>krzyżowym</td><td colspan="2">krzyżowych</td>'
	],
	[
		'wołacz',
		'<td colspan="2">krzyżowy</td><td>krzyżowa</td><td>krzyżowe</td><td>krzyżowi</td><td>krzyżowe</td>'
	]
];

export const WIKTIONARY_TABLES = {
	krzyżowy: `<table class="wikitable odmiana adj"><tr><th rowspan="2">[[przypadek]]</th><th colspan="4">liczba pojedyncza</th><th colspan="2">liczba mnoga</th></tr><tr><td class="forma">mos/mzw</td><td class="forma">mrz</td><td class="forma">ż</td><td class="forma">n</td><td class="forma">mos</td><td class="forma">nmos</td></tr>${ADJECTIVE_ROWS.map(([label, cells]) => `<tr><td class="forma">[[${label}]]</td>${cells}</tr>`).join('')}</table>`
};

export const OWN_FIELDS = [
	{
		id: '00000000-0000-4000-8000-000000000401',
		name: 'Wykład',
		description: null,
		kind: 'list',
		multiple: false
	},
	{
		id: '00000000-0000-4000-8000-000000000402',
		name: 'Motywy',
		description: 'Co przedstawia dzieło',
		kind: 'list',
		multiple: true
	},
	{
		id: '00000000-0000-4000-8000-000000000403',
		name: 'Źródło',
		description: 'Podręcznik i strona',
		kind: 'text',
		multiple: false
	},
	{
		id: '00000000-0000-4000-8000-000000000404',
		name: 'Widziane na żywo',
		description: null,
		kind: 'flag',
		multiple: false
	}
];

export const OWN_VALUE_USAGE = [
	['00000000-0000-4000-8000-000000000401', 'Sztuka renesansu', 3],
	['00000000-0000-4000-8000-000000000401', 'Barok – ćwiczenia', 2],
	['00000000-0000-4000-8000-000000000402', 'portret', 2],
	['00000000-0000-4000-8000-000000000402', 'pejzaż', 1],
	['00000000-0000-4000-8000-000000000402', 'Aniol', 1],
	['00000000-0000-4000-8000-000000000402', 'Anioł', 2]
].map(([field, name, count], index) => ({
	id: `00000000-0000-4000-8000-0000000005${String(index).padStart(2, '0')}`,
	category_code: field,
	name,
	artwork_count: count
}));

export const OWN_FIELD_USAGE = [
	{ field_id: '00000000-0000-4000-8000-000000000401', artwork_count: 5 },
	{ field_id: '00000000-0000-4000-8000-000000000402', artwork_count: 4 },
	{ field_id: '00000000-0000-4000-8000-000000000403', artwork_count: 2 },
	{ field_id: '00000000-0000-4000-8000-000000000404', artwork_count: 3 }
];

function pin(artworkNumber, number, x, y, glossaryNumber, text, viewWidth = null) {
	const row = ARTWORKS.find((artwork) => artwork.record_number === artworkNumber);
	return {
		id: `00000000-0000-4000-a000-${String(number).padStart(12, '0')}`,
		image_id: row.artwork_images.find((image) => image.position === 0).id,
		x,
		y,
		glossary_entry_id: glossaryNumber
			? `00000000-0000-4000-9000-${String(glossaryNumber).padStart(12, '0')}`
			: null,
		text,
		view_width: viewWidth,
		created_at: '2026-10-22T10:00:00Z'
	};
}

export const ARTWORK_PINS = [
	pin(6, 1, 0.62, 0.34, 2, 'Półkolista część chóru, widoczna od wschodu.'),
	pin(6, 2, 0.3, 0.55, null, 'Rozeta, której szkło pochodzi z XIII wieku.'),
	pin(6, 3, 0.48, 0.2, 5, null),
	pin(2, 4, 0.62, 0.38, null, 'Księżyc w nowiu otoczony poświatą.', 0.12)
];
