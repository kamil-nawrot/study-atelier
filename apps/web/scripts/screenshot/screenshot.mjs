import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import {
	ARTWORK_PINS,
	ARTWORKS,
	CATALOGUE_MUSEUMS,
	GLOSSARY_ENTRIES,
	OWN_FIELD_USAGE,
	OWN_FIELDS,
	OWN_VALUE_USAGE,
	PROFILE,
	ARTWORK_SEARCH,
	PEOPLE,
	PERIOD_ERA_USAGE,
	REVIEW_CARDS,
	TIMELINE_EVENTS,
	VISITS,
	STYLE_PERIOD_USAGE,
	VALUE_DETAILS,
	VALUE_USAGE,
	valueId,
	IMAGE_HOST,
	SUPABASE_URL,
	TRASHED,
	USER,
	WIKTIONARY_PAGES,
	WIKTIONARY_TABLES,
	WIKIDATA_DATES,
	WIKIDATA_HUMANS,
	WIKIPEDIA_PAGES,
	commonsSize,
	fakeSession,
	imageSvg
} from './fixtures.mjs';

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPO_DIR = path.resolve(WEB_DIR, '../..');
const PORT = 5199;
const SCROLL_STEP = 40;
const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/update-password'];
const VIEWPORTS = {
	desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
	wide: { width: 1920, height: 1000, deviceScaleFactor: 1 },
	phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};
const USAGE = `Usage: pnpm screenshot <path> [options]

  <path>             route to render, for example /atelier or /atelier/1
  --out <dir>        output folder (default tmp/screenshots in the repository)
  --name <name>      file name prefix (default derived from the path)
  --viewport <v>     desktop, wide (1920 x 1000), phone or both (default both)
  --combine          also write one image with the desktop and phone shots side by side
  --full-page        capture the whole page, not only the first screen
  --signed-out       do not inject the fake session (default for the auth routes)
  --storage k=v      set a localStorage entry before the page loads (repeatable)
  --session k=v      set a sessionStorage entry before the page loads (repeatable)
  --wait <selector>  wait for this selector before capturing
  --type <text>      click the notes editor and type this text before capturing
  --script <file>    run this JavaScript file in the page before capturing, for example to mock a variant
  --steps <file>     run the default export of this module with the Playwright page before capturing,
                     for a flow across navigations (clicks, history.back())
  --repeat <n>       show every sample artwork n times, to have more to scroll through
  --empty            show an atelier with no artworks, values, entries, events or visits
  --scroll           also record a GIF of scrolling the page from top to bottom (needs ffmpeg)
  --url <base>       use a running dev server instead of starting one
`;

function parseArgs(argv) {
	const options = {
		storage: {},
		session: {},
		viewport: 'both',
		out: path.join(REPO_DIR, 'tmp/screenshots')
	};
	const rest = [...argv];
	while (rest.length > 0) {
		const arg = rest.shift();
		if (arg === '--') continue;
		if (arg === '--help' || arg === '-h') options.help = true;
		else if (arg === '--combine') options.combine = true;
		else if (arg === '--scroll') options.scroll = true;
		else if (arg === '--full-page') options.fullPage = true;
		else if (arg === '--signed-out') options.signedOut = true;
		else if (arg === '--empty') options.empty = true;
		else if (
			[
				'--out',
				'--name',
				'--viewport',
				'--wait',
				'--url',
				'--script',
				'--steps',
				'--type',
				'--repeat'
			].includes(arg)
		) {
			options[arg.slice(2)] = rest.shift();
		} else if (arg === '--storage' || arg === '--session') {
			const [key, ...value] = (rest.shift() ?? '').split('=');
			options[arg.slice(2)][key] = value.join('=');
		} else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
		else options.route = arg;
	}
	return options;
}

function json(route, body, status = 200, headers = {}) {
	return route.fulfill({
		status,
		contentType: 'application/json',
		headers: corsHeaders(headers),
		body: JSON.stringify(body)
	});
}

function corsHeaders(extra = {}) {
	return {
		'access-control-allow-origin': '*',
		'access-control-allow-headers': '*',
		'access-control-allow-methods': '*',
		'access-control-expose-headers': '*',
		...extra
	};
}

function filteredRows(url) {
	const params = url.searchParams;
	const trash = params.get('deleted_at') === 'not.is.null';
	let rows = trash ? TRASHED : ARTWORKS;
	const number = params.get('record_number');
	if (number?.startsWith('eq.')) {
		rows = [...ARTWORKS, ...TRASHED].filter(
			(row) => row.record_number === Number(number.slice(3)) && !row.deleted_at === !trash
		);
	}
	const id = params.get('id');
	if (id?.startsWith('eq.')) {
		rows = [...ARTWORKS, ...TRASHED].filter((row) => row.id === id.slice(3));
	}
	if (id?.startsWith('in.(')) {
		const ids = id.slice(4, -1).split(',');
		rows = [...ARTWORKS, ...TRASHED].filter((row) => ids.includes(row.id));
	}
	return rows;
}

function hasImage(row) {
	return row.artwork_images.some((image) => image.position === 0);
}

function reviewCounts(dayStartText) {
	const dayStart = new Date(dayStartText ?? Date.now());
	const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;
	const live = ARTWORKS.filter(hasImage).map((row) => row.id);
	const cards = REVIEW_CARDS.filter((card) => live.includes(card.artwork_id));
	return {
		due: cards.filter((card) => new Date(card.due).getTime() < dayEnd).length,
		new_available: live.filter((id) => !cards.some((card) => card.artwork_id === id)).length,
		new_today: 0,
		with_image: live.length
	};
}

function valuesOf(row, category) {
	return (row.artwork_values ?? [])
		.filter((link) => link.category_values.category_code === category)
		.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
		.map((link) => link.category_values.name);
}

function inScope(row, kind, value) {
	if (kind === 'era') return row.era_code === value;
	if (kind === 'period') return valuesOf(row, 'period')[0] === value;
	if (kind === 'style') return valuesOf(row, 'style').includes(value);
	return true;
}

function rotated(modes, slot) {
	return modes.slice(slot % modes.length).concat(modes.slice(0, slot % modes.length));
}

function quizFor(row, mode, pool) {
	const others = pool.filter((other) => other.id !== row.id && other.title !== row.title);
	if (mode === 'quiz_style') {
		const [style] = valuesOf(row, 'style');
		const styles = [...new Set(others.flatMap((other) => valuesOf(other, 'style')))].filter(
			(other) => !valuesOf(row, 'style').includes(other)
		);
		if (!style || styles.length < 3) return undefined;
		return [
			{ label: styles[0] },
			{ label: style, right: true },
			...styles.slice(1, 3).map((label) => ({ label }))
		];
	}
	if (mode === 'quiz_author') {
		const authors = valuesOf(row, 'author');
		const sets = [
			...new Set(
				others
					.map((other) => valuesOf(other, 'author'))
					.filter((set) => set.length > 0 && !set.some((name) => authors.includes(name)))
					.map((set) => set.join(', '))
			)
		];
		if (authors.length === 0 || sets.length < 3) return undefined;
		const options = sets.slice(0, 3).map((label) => ({ label }));
		options.splice(row.record_number % 4, 0, { label: authors.join(', '), right: true });
		return options;
	}
	if (others.length < 3) return undefined;
	const shares = (category, other) =>
		valuesOf(row, category).some((value) => valuesOf(other, category).includes(value));
	const reason = (other) =>
		shares('author', other)
			? 'author'
			: shares('style', other)
				? 'style'
				: shares('period', other)
					? 'period'
					: undefined;
	const options = others.slice(0, 3).map((other) => ({
		artwork_id: other.id,
		label: other.title,
		...(reason(other) ? { reason: reason(other) } : {})
	}));
	options.splice(row.record_number % 4, 0, { artwork_id: row.id, label: row.title, right: true });
	return options;
}

function pinQuizFor(row) {
	const images = row.artwork_images ?? [];
	const pin = ARTWORK_PINS.find(
		(candidate) =>
			candidate.glossary_entry_id && images.some((image) => image.id === candidate.image_id)
	);
	if (!pin) return undefined;
	const term = GLOSSARY_ENTRIES.find((entry) => entry.id === pin.glossary_entry_id);
	const others = GLOSSARY_ENTRIES.filter((entry) => entry.id !== term.id).sort(
		(a, b) => Number(b.category === term.category) - Number(a.category === term.category)
	);
	const image = images.find((candidate) => candidate.id === pin.image_id);
	return {
		artwork_id: row.id,
		mode: 'quiz_pin',
		options: [
			{ label: others[0].name },
			{ label: term.name, right: true },
			...others.slice(1, 3).map((entry) => ({ label: entry.name }))
		],
		pin: { x: pin.x, y: pin.y, image }
	};
}

function reviewSession({
	day_start: dayStartText,
	session_form: form = 'mixed',
	scope_kind: kind = 'all',
	scope_value: value,
	free_round: freeRound
} = {}) {
	const dayEnd = new Date(dayStartText ?? Date.now()).getTime() + 24 * 60 * 60 * 1000;
	const pool = ARTWORKS.filter((row) => hasImage(row) && inScope(row, kind, value));
	if (pool.length < 20) return [];
	const cardOf = (row) => REVIEW_CARDS.find((card) => card.artwork_id === row.id);
	const due = pool
		.filter((row) => cardOf(row) && new Date(cardOf(row).due).getTime() < dayEnd)
		.sort((a, b) => new Date(cardOf(a).due).getTime() - new Date(cardOf(b).due).getTime())
		.slice(0, 20);
	const fresh = pool.filter((row) => !cardOf(row)).slice(0, Math.min(10, 20 - due.length));
	const known = pool
		.filter((row) => cardOf(row))
		.sort((a, b) => cardOf(a).stability - cardOf(b).stability);
	const free = Array.from(
		{ length: Math.min(20, known.length) },
		(_, index) => known[(index + (freeRound ?? 0) * 20) % known.length]
	);
	return (freeRound === undefined ? [...due, ...fresh] : free).map((row, slot) => {
		const card = cardOf(row);
		const pinQuiz = form === 'flashcards' ? undefined : pinQuizFor(row);
		if (pinQuiz) return pinQuiz;
		const modes =
			form === 'flashcards'
				? []
				: form === 'quizzes'
					? rotated(['quiz_title', 'quiz_image', 'quiz_author', 'quiz_style'], slot)
					: !card || card.state !== 2
						? rotated(['quiz_title', 'quiz_image', 'quiz_author'], slot)
						: [];
		for (const mode of modes) {
			const options = quizFor(row, mode, pool);
			if (options) return { artwork_id: row.id, mode, options };
		}
		return { artwork_id: row.id, mode: 'flashcard' };
	});
}

function notesMentions(needle) {
	const values = Object.entries(VALUE_DETAILS).flatMap(([table, rows]) =>
		rows.map((row) => ({
			kind: table.replace('_details', ''),
			id: row.value_id ?? row.era_code,
			record_number: null,
			title: null,
			notes: row.notes
		}))
	);
	const artworks = ARTWORKS.map((row) => ({
		kind: 'artwork',
		id: row.id,
		record_number: row.record_number,
		title: row.title,
		notes: row.notes
	}));
	return [...values, ...artworks].filter(
		(row) => row.notes && (needle === undefined || row.notes.includes(needle))
	);
}

function pinsRoute(route, request, url) {
	if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: corsHeaders() });
	if (request.method() !== 'GET') return json(route, [ARTWORK_PINS[0]], 201);
	const entry = url.searchParams.get('glossary_entry_id');
	if (entry) {
		return json(
			route,
			ARTWORK_PINS.filter((row) => `eq.${row.glossary_entry_id}` === entry).map((row) => ({
				id: row.id,
				artwork_images: {
					artwork_id: ARTWORKS.find((artwork) =>
						artwork.artwork_images.some((image) => image.id === row.image_id)
					).id
				}
			}))
		);
	}
	const recordNumber = url.searchParams.get('artwork_images.artworks.record_number');
	if (recordNumber) {
		const artwork = ARTWORKS.find((row) => `eq.${row.record_number}` === recordNumber);
		const imageIds = artwork?.artwork_images.map((image) => image.id) ?? [];
		return json(
			route,
			ARTWORK_PINS.filter((row) => imageIds.includes(row.image_id))
		);
	}
	const filter = url.searchParams.get('image_id') ?? '';
	const ids = filter.startsWith('in.(') ? filter.slice(4, -1).split(',') : [];
	return json(
		route,
		ARTWORK_PINS.filter((row) => ids.includes(row.image_id))
	);
}

function glossaryRoute(route, request, url) {
	const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
	if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: corsHeaders() });
	if (request.method() !== 'GET') {
		return json(
			route,
			wantsObject ? { id: GLOSSARY_ENTRIES[0].id } : [{ id: GLOSSARY_ENTRIES[0].id }],
			201
		);
	}
	const id = url.searchParams.get('id');
	const rows = id?.startsWith('eq.')
		? GLOSSARY_ENTRIES.filter((row) => row.id === id.slice(3))
		: GLOSSARY_ENTRIES;
	if (!wantsObject) return json(route, rows);
	if (rows.length === 1) return json(route, rows[0]);
	return json(
		route,
		{ code: 'PGRST116', message: 'The result contains 0 rows', details: null, hint: null },
		406
	);
}

function visitsRoute(route, request, url) {
	const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
	if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: corsHeaders() });
	const id = url.searchParams.get('id');
	const number = url.searchParams.get('visit_artworks.artworks.record_number');
	const artworkId = number?.startsWith('eq.')
		? `00000000-0000-4000-8000-${number.slice(3).padStart(12, '0')}`
		: null;
	const rows = VISITS.filter(
		(row) =>
			(!id?.startsWith('eq.') || row.id === id.slice(3)) &&
			(!artworkId || row.visit_artworks.some((seen) => seen.artwork_id === artworkId))
	);
	if (!wantsObject) return json(route, rows);
	return json(route, rows[0] ?? null);
}

function profileRoute(route, request) {
	const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
	if (request.method() !== 'GET') return json(route, wantsObject ? PROFILE : [PROFILE], 201);
	return json(route, wantsObject ? PROFILE : [PROFILE]);
}

async function mockSupabase(context) {
	await context.route(`${SUPABASE_URL}/**`, async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		if (request.method() === 'OPTIONS') {
			return route.fulfill({ status: 204, headers: corsHeaders() });
		}
		if (url.pathname.startsWith('/auth/v1/user')) return json(route, USER);
		if (url.pathname.startsWith('/auth/v1/')) {
			return json(route, { ...fakeSession(), user: USER });
		}
		if (url.pathname.startsWith('/storage/v1/')) return json(route, []);
		if (url.pathname === '/rest/v1/rpc/value_usage') {
			const codes = url.searchParams.get('category_code');
			return json(
				route,
				codes
					? OWN_VALUE_USAGE.filter((row) => codes.includes(row.category_code))
					: [
							...VALUE_USAGE.filter(
								(row) => !OWN_FIELDS.some((field) => field.id === row.category_code)
							),
							...OWN_VALUE_USAGE
						]
			);
		}
		if (url.pathname === '/rest/v1/rpc/artwork_field_usage') return json(route, OWN_FIELD_USAGE);
		if (url.pathname === '/rest/v1/artwork_fields' && request.method() === 'GET') {
			return json(route, OWN_FIELDS);
		}
		if (url.pathname === '/rest/v1/rpc/period_era_usage') return json(route, PERIOD_ERA_USAGE);
		if (url.pathname === '/rest/v1/rpc/style_period_usage') return json(route, STYLE_PERIOD_USAGE);
		if (url.pathname === '/rest/v1/rpc/review_counts') {
			const counts = reviewCounts(request.postDataJSON()?.day_start);
			const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
			return json(route, wantsObject ? counts : [counts]);
		}
		if (url.pathname === '/rest/v1/rpc/storage_usage') {
			const usage = { used_bytes: 9_122_611, quota_bytes: 209_715_200 };
			const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
			return json(route, wantsObject ? usage : [usage]);
		}
		if (url.pathname === '/rest/v1/rpc/review_session') {
			return json(route, reviewSession(request.postDataJSON() ?? {}));
		}
		if (url.pathname === '/rest/v1/rpc/review_streak') {
			return json(route, REVIEW_CARDS.length > 0 ? 5 : 0);
		}
		if (url.pathname === '/rest/v1/rpc/notes_mentions') {
			return json(route, notesMentions(request.postDataJSON()?.needle));
		}
		if (url.pathname === '/rest/v1/rpc/record_review') {
			return route.fulfill({ status: 204, headers: corsHeaders() });
		}
		if (url.pathname === '/rest/v1/review_cards') return json(route, REVIEW_CARDS);
		if (url.pathname === '/rest/v1/timeline_events') {
			if (request.method() === 'POST') return json(route, { id: TIMELINE_EVENTS[0].id }, 201);
			if (request.method() === 'PATCH') return json(route, { id: TIMELINE_EVENTS[0].id });
			return json(route, TIMELINE_EVENTS);
		}
		if (url.pathname === '/rest/v1/visits') return visitsRoute(route, request, url);
		if (url.pathname === '/rest/v1/rpc/save_visit') return json(route, VISITS[0].id);
		if (url.pathname === '/rest/v1/catalogue_museums') return json(route, CATALOGUE_MUSEUMS);
		if (
			url.pathname === '/rest/v1/location_details' &&
			url.searchParams.get('country_code') === 'not.is.null'
		) {
			const names = new Map(
				ARTWORKS.flatMap((row) => row.artwork_values).map(({ category_values: value }) => [
					valueId(value.category_code, value.name),
					value.name
				])
			);
			return json(
				route,
				VALUE_DETAILS.location_details
					.filter((row) => row.country_code && names.has(row.value_id))
					.map((row) => ({
						country_code: row.country_code,
						category_values: { name: names.get(row.value_id) }
					}))
			);
		}
		if (url.pathname === '/rest/v1/artwork_pins') return pinsRoute(route, request, url);
		if (url.pathname === '/rest/v1/profiles') return profileRoute(route, request);
		if (url.pathname === '/rest/v1/glossary_entries') return glossaryRoute(route, request, url);
		if (url.pathname.startsWith('/rest/v1/rpc/')) {
			return json(route, { id: ARTWORKS[0].id, record_number: ARTWORKS[0].record_number });
		}
		if (url.pathname === '/rest/v1/artwork_values') {
			const number = Number(url.searchParams.get('artworks.record_number')?.slice(3));
			const artwork = ARTWORKS.find((row) => row.record_number === number);
			const values = (artwork?.artwork_values ?? []).map(({ category_values: value }) => {
				const table = `${value.category_code}_details`;
				const id = valueId(value.category_code, value.name);
				return {
					artworks: { record_number: number },
					category_values: {
						...value,
						[table]: (VALUE_DETAILS[table] ?? []).filter((row) => row.value_id === id)
					}
				};
			});
			return json(route, values);
		}
		const detailsTable = url.pathname.replace('/rest/v1/', '');
		if (detailsTable in VALUE_DETAILS) {
			const [column, filter] = [...url.searchParams].find(([key]) => key !== 'select') ?? [];
			return json(
				route,
				VALUE_DETAILS[detailsTable].filter((row) => `eq.${row[column]}` === filter)
			);
		}
		if (url.pathname === '/rest/v1/artworks') {
			const imagePosition = url.searchParams.get('artwork_images.position');
			const rows = filteredRows(url).map((row) => ({
				...row,
				artwork_images: row.artwork_images.filter(
					(image) => imagePosition === null || imagePosition === `eq.${image.position}`
				),
				artwork_values: row.artwork_values.map((link) => ({
					...link,
					category_values: {
						...link.category_values,
						author_details: VALUE_DETAILS.author_details.filter(
							(details) =>
								details.value_id ===
								valueId(link.category_values.category_code, link.category_values.name)
						)
					}
				}))
			}));
			const wantsObject = (request.headers().accept ?? '').includes('vnd.pgrst.object');
			if (!wantsObject) return json(route, rows);
			if (rows.length === 1) return json(route, rows[0]);
			return json(
				route,
				{ code: 'PGRST116', message: 'The result contains 0 rows', details: null, hint: null },
				406
			);
		}
		return json(route, []);
	});
}

async function mockImages(context) {
	const svg = (body) => ({
		status: 200,
		contentType: 'image/svg+xml',
		headers: corsHeaders(),
		body
	});

	await context.route(`${IMAGE_HOST}/**`, (route) => {
		const name = new URL(route.request().url()).pathname;
		const size = /-(\d+)x(\d+)\.svg$/.exec(name);
		return route.fulfill(svg(imageSvg(name, Number(size?.[1] ?? 4), Number(size?.[2] ?? 5))));
	});

	await context.route(/^https:\/\/(upload|thumb)\.wikimedia\.org\//, (route) => {
		const name = decodeURIComponent(new URL(route.request().url()).pathname);
		const file = name.split('/').at(-2) ?? name;
		const [width, height] = commonsSize(file);
		return route.fulfill(svg(imageSvg(file, width, height)));
	});

	await context.route(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, (route) => {
		const file = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1));
		const [width, height] = commonsSize(file);
		return route.fulfill(svg(imageSvg(file, width, height)));
	});

	await context.route(/^https:\/\/commons\.wikimedia\.org\/w\/api\.php/, (route) => {
		const titles = (new URL(route.request().url()).searchParams.get('titles') ?? '')
			.split('|')
			.filter(Boolean);
		const pages = titles.map((title) => {
			const file = title.replace(/^File:/, '');
			const [width, height] = commonsSize(file);
			const encoded = encodeURIComponent(file);
			return {
				title,
				imageinfo: [
					{
						thumburl: `https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/${encoded}/500px-${encoded}?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail`,
						width: width * 200,
						height: height * 200,
						extmetadata: {
							LicenseShortName: { value: 'Public domain' },
							LicenseUrl: { value: 'https://example.com/licence' },
							Artist: { value: 'Example Artist' }
						}
					}
				]
			};
		});
		return json(route, { query: { pages } });
	});

	await context.route(/^https:\/\/pl\.wikipedia\.org\/w\/api\.php/, (route) => {
		const params = new URL(route.request().url()).searchParams;
		const search = params.get('srsearch');
		if (search !== null) {
			const word = search.toLocaleLowerCase('pl').split(' ')[0];
			const hits = WIKIPEDIA_PAGES.filter((page) => page.keywords.includes(word)).map((page) => ({
				pageid: page.pageid,
				title: page.title
			}));
			return json(route, { query: { search: hits } });
		}
		const ids = (params.get('pageids') ?? '').split('|').map(Number);
		return json(route, {
			query: { pages: WIKIPEDIA_PAGES.filter((page) => ids.includes(page.pageid)) }
		});
	});

	await context.route(/^https:\/\/pl\.wiktionary\.org\/w\/api\.php/, (route) => {
		const params = new URL(route.request().url()).searchParams;
		if (params.get('action') === 'expandtemplates') {
			const wikitext = WIKTIONARY_TABLES[params.get('title') ?? ''] ?? '';
			return json(route, { expandtemplates: { wikitext } });
		}
		const title = params.get('page') ?? '';
		const wikitext = WIKTIONARY_PAGES[title];
		return json(
			route,
			wikitext === undefined ? { error: { code: 'missingtitle' } } : { parse: { title, wikitext } }
		);
	});

	await context.route(/^https:\/\/(query\.wikidata|www\.wikidata)\.org\//, (route) => {
		const params = new URL(route.request().url()).searchParams;
		if (params.get('action') === 'wbgetentities') {
			const entities = Object.fromEntries(
				(params.get('ids') ?? '').split('|').map((id) => [
					id,
					{
						claims: {
							...WIKIDATA_DATES[id],
							P31: [
								{
									mainsnak: {
										datavalue: { value: { id: WIKIDATA_HUMANS.includes(id) ? 'Q5' : 'Q386724' } }
									}
								}
							]
						}
					}
				])
			);
			return json(route, { entities });
		}
		const query = params.get('query') ?? '';
		const rows = query.includes('wd:Q5;')
			? PEOPLE
			: ARTWORK_SEARCH.filter((artwork) => query.includes(`"${artwork.title}"`));
		const bindings = rows.map((row) =>
			Object.fromEntries(Object.entries(row).map(([key, value]) => [key, { value }]))
		);
		return json(route, { results: { bindings }, search: [], entities: {} });
	});
}

async function waitForServer(base, attempts = 120) {
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		try {
			const response = await fetch(base);
			if (response.status < 500) return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	throw new Error(`The dev server did not answer at ${base}`);
}

function startDevServer() {
	const vite = path.join(WEB_DIR, 'node_modules/.bin/vite');
	const child = spawn(vite, ['dev', '--port', String(PORT), '--strictPort'], {
		cwd: WEB_DIR,
		env: { ...process.env, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: 'dummy' },
		stdio: 'ignore'
	});
	return child;
}

function fallbackExecutable() {
	for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers']) {
		if (!root || !existsSync(root)) continue;
		const folder = readdirSync(root).find((entry) => /^chromium-\d+$/.test(entry));
		if (folder) return path.join(root, folder, 'chrome-linux/chrome');
	}
	return undefined;
}

async function launchBrowser() {
	try {
		return await chromium.launch();
	} catch (error) {
		const executablePath = fallbackExecutable();
		if (!executablePath) throw error;
		return chromium.launch({ executablePath });
	}
}

async function capture(browser, base, options, name) {
	const viewport = VIEWPORTS[name];
	const context = await browser.newContext({
		viewport: { width: viewport.width, height: viewport.height },
		deviceScaleFactor: viewport.deviceScaleFactor,
		isMobile: viewport.isMobile,
		hasTouch: viewport.hasTouch
	});
	await mockSupabase(context);
	await mockImages(context);
	const signedOut = options.signedOut || AUTH_PATHS.some((p) => options.route.startsWith(p));
	await context.addInitScript(
		({ key, session, entries, sessionEntries }) => {
			if (session) localStorage.setItem(key, JSON.stringify(session));
			for (const [entryKey, value] of Object.entries(entries)) {
				localStorage.setItem(entryKey, value);
			}
			for (const [entryKey, value] of Object.entries(sessionEntries)) {
				sessionStorage.setItem(entryKey, value);
			}
		},
		{
			key: `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`,
			session: signedOut ? null : fakeSession(),
			entries: options.storage,
			sessionEntries: options.session
		}
	);
	const page = await context.newPage();
	await page.goto(new URL(options.route, base).href, { waitUntil: 'networkidle' });
	if (options.wait) await page.waitForSelector(options.wait);
	if (options.script) await page.evaluate(readFileSync(path.resolve(options.script), 'utf8'));
	if (options.steps) {
		const { default: steps } = await import(pathToFileURL(path.resolve(options.steps)).href);
		await steps(page);
	}
	if (options.type) {
		const editor = page.locator('.ProseMirror').first();
		await editor.scrollIntoViewIfNeeded();
		await editor.click();
		await page.keyboard.press('Control+End');
		await page.keyboard.type(options.type);
	}
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(400);
	const file = path.join(options.out, `${options.name}-${name}.png`);
	await page.screenshot({ path: file, fullPage: Boolean(options.fullPage) });
	await context.close();
	return file;
}

function repeatArtworks(times) {
	const originals = [...ARTWORKS];
	for (let copy = 1; copy < times; copy += 1) {
		for (const row of originals) {
			ARTWORKS.push({
				...row,
				id: `${row.id}-copy-${copy}`,
				record_number: row.record_number + copy * 1000
			});
		}
	}
}

function emptyAtelier() {
	for (const rows of [
		ARTWORKS,
		ARTWORK_PINS,
		GLOSSARY_ENTRIES,
		OWN_FIELD_USAGE,
		OWN_FIELDS,
		OWN_VALUE_USAGE,
		PERIOD_ERA_USAGE,
		REVIEW_CARDS,
		STYLE_PERIOD_USAGE,
		TIMELINE_EVENTS,
		TRASHED,
		VALUE_USAGE,
		VISITS,
		...Object.values(VALUE_DETAILS)
	]) {
		rows.length = 0;
	}
}

async function recordScroll(browser, base, options, name) {
	const viewport = VIEWPORTS[name];
	const folder = path.join(options.out, `${options.name}-${name}-frames`);
	rmSync(folder, { recursive: true, force: true });
	mkdirSync(folder, { recursive: true });
	const context = await browser.newContext({
		viewport: { width: viewport.width, height: viewport.height }
	});
	await mockSupabase(context);
	await mockImages(context);
	await context.addInitScript(
		({ key, session, entries }) => {
			localStorage.setItem(key, JSON.stringify(session));
			for (const [entryKey, value] of Object.entries(entries)) {
				localStorage.setItem(entryKey, value);
			}
		},
		{
			key: `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`,
			session: fakeSession(),
			entries: options.storage
		}
	);
	const page = await context.newPage();
	await page.goto(new URL(options.route, base).href, { waitUntil: 'networkidle' });
	if (options.wait) await page.waitForSelector(options.wait);
	await page.waitForTimeout(800);
	const total = await page.evaluate(
		() => document.documentElement.scrollHeight - window.innerHeight
	);
	let frame = 0;
	for (let position = 0; position <= total + SCROLL_STEP; position += SCROLL_STEP) {
		await page.evaluate(
			(top) =>
				new Promise((resolve) => {
					window.scrollTo(0, top);
					requestAnimationFrame(() => requestAnimationFrame(resolve));
				}),
			Math.min(position, total)
		);
		const file = path.join(folder, `${String(frame).padStart(5, '0')}.jpg`);
		await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
		frame += 1;
	}
	await context.close();
	const target = path.join(options.out, `${options.name}-${name}-scroll.gif`);
	const filter = 'scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse';
	const result = spawnSync(
		'ffmpeg',
		['-y', '-framerate', '15', '-i', path.join(folder, '%05d.jpg'), '-vf', filter, target],
		{ stdio: 'ignore' }
	);
	rmSync(folder, { recursive: true, force: true });
	if (result.status !== 0) throw new Error('ffmpeg could not convert the recording');
	return target;
}

async function combine(browser, files, target) {
	const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
	const page = await context.newPage();
	const images = files
		.map((file) => `<img src="data:image/png;base64,${readFileSync(file).toString('base64')}">`)
		.join('');
	await page.setContent(
		`<body style="margin:0;display:flex;gap:24px;align-items:flex-start;background:#111;padding:24px;width:max-content">${images}</body><style>html{background:#111}</style>`
	);
	await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
	await page.evaluate(() => {
		const [desktop, phone] = document.images;
		if (!phone) return;
		const height = Math.min(desktop.naturalHeight, 900);
		desktop.style.height = `${height}px`;
		phone.style.height = `${height}px`;
	});
	const size = await page.evaluate(() => ({
		width: Math.ceil(document.body.scrollWidth),
		height: Math.ceil(document.body.scrollHeight)
	}));
	await page.setViewportSize(size);
	await page.screenshot({ path: target, fullPage: true });
	await context.close();
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help || !options.route) {
		process.stdout.write(USAGE);
		return;
	}
	if (!options.route.startsWith('/')) options.route = `/${options.route}`;
	options.name ??= options.route.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home';
	mkdirSync(options.out, { recursive: true });
	if (options.repeat) repeatArtworks(Number(options.repeat));
	if (options.empty) emptyAtelier();

	const names = options.viewport === 'both' ? ['desktop', 'phone'] : [options.viewport];
	if (names.some((name) => !(name in VIEWPORTS))) throw new Error(USAGE);

	const server = options.url ? null : startDevServer();
	const base = options.url ?? `http://localhost:${PORT}`;
	let browser;
	try {
		await waitForServer(base);
		browser = await launchBrowser();
		const files = [];
		for (const name of names) files.push(await capture(browser, base, options, name));
		if (options.scroll) {
			for (const name of names) files.push(await recordScroll(browser, base, options, name));
		}
		if (options.combine && files.length === 2) {
			const target = path.join(options.out, `${options.name}-both.png`);
			await combine(browser, files, target);
			files.push(target);
		}
		for (const file of files) process.stdout.write(`${file}\n`);
	} finally {
		await browser?.close();
		server?.kill('SIGTERM');
	}
}

main().catch((error) => {
	process.stderr.write(`${error.message}\n`);
	process.exit(1);
});
