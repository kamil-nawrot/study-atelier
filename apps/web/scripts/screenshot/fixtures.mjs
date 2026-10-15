export const SUPABASE_URL = 'https://abcd.supabase.co';
export const IMAGE_HOST = 'https://images.mock.test';

const COMMONS_SIZES = {
	'Mona_Lisa.jpg': [4, 6],
	'The_Starry_Night.jpg': [5, 4],
	'Girl_with_a_Pearl_Earring.jpg': [4, 5]
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
	const w = width * 100;
	const h = height * 100;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.62}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.18}" fill="${light}" fill-opacity="0.55"/></svg>`;
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

function artwork(number, title, authors, year, era, extra = {}) {
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
		source_wikidata_id: null,
		source_image_file: null,
		source_image_licence: null,
		source_image_licence_url: null,
		source_image_attribution: null,
		own_image_path: null,
		own_image_url: null,
		image_width: null,
		image_height: null,
		deleted_at: null,
		artwork_values: authors.map((name, position) => ({
			position,
			category_values: { category_code: 'author', name }
		})),
		...extra
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
					artwork(1, 'Mona Lisa', ['Leonardo da Vinci'], 1503, 'early_modern', {
						...commonsImage('Mona_Lisa.jpg'),
						year_approximate: true,
						notes: 'Sample note about the sfumato technique.'
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
		type_code: 'architecture'
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

export const TRASHED = [
	artwork(11, 'Discarded sketch', ['Learner Example'], 2020, 'contemporary', {
		...ownImage(11, 4, 5),
		deleted_at: '2026-01-01T10:00:00Z'
	})
];

function valueId(category, name) {
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
	period_details: [
		{
			value_id: valueId('period', 'Renaissance'),
			summary: 'The revival of antiquity in Italy: harmony, proportion and perspective.',
			notes: 'To check: where does **Mannerism** end and the Baroque begin?'
		}
	]
};

export const USER = {
	id: '11111111-1111-4111-8111-111111111111',
	aud: 'authenticated',
	role: 'authenticated',
	email: 'learner@example.com',
	app_metadata: {},
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
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
