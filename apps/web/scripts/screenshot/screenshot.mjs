import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
	EXHIBITS,
	EXHIBIT_TIERS,
	commonsSize,
	fakeSession,
	imageSvg
} from './fixtures.mjs';
import { logRequests, summarise } from './request-log.mjs';

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
  --log-requests     write the Supabase requests of each viewport to <name>-<viewport>-requests.json
                     and print them per phase (load, steps), shell and view, with their payload sizes
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
		else if (arg === '--log-requests') options.logRequests = true;
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
	const era = params.get('era_code');
	if (era?.startsWith('eq.')) rows = rows.filter((row) => row.era_code === era.slice(3));
	const term = params.get('pinned.artwork_pins.glossary_entry_id');
	if (term?.startsWith('eq.')) {
		rows = rows.filter((row) =>
			ARTWORK_PINS.some(
				(pin) =>
					pin.glossary_entry_id === term.slice(3) &&
					row.artwork_images.some((image) => image.id === pin.image_id)
			)
		);
	}
	const visit = params.get('seen.visit_id');
	if (visit?.startsWith('eq.')) {
		const seen = VISITS.find((candidate) => candidate.id === visit.slice(3));
		rows = rows.filter((row) =>
			(seen?.visit_artworks ?? []).some((link) => link.artwork_id === row.id)
		);
	}
	const value = params.get('valued.value_id');
	if (value?.startsWith('eq.')) {
		rows = rows.filter((row) =>
			row.artwork_values.some(
				({ category_values: linked }) =>
					valueId(linked.category_code, linked.name) === value.slice(3)
			)
		);
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
	free_round: freeRound,
	time_questions: timeQuestions = false
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
	let settled = 0;
	const items = (freeRound === undefined ? [...due, ...fresh] : free).map((row, slot) => {
		const card = cardOf(row);
		const pinQuiz = form === 'flashcards' ? undefined : pinQuizFor(row);
		if (pinQuiz) return pinQuiz;
		if (form !== 'flashcards' && card?.state === 2 && card.stability >= 7) {
			settled += 1;
			if (settled % 3 === 0) return { artwork_id: row.id, mode: 'quiz_typed', options: [] };
		}
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
	if (!timeQuestions || items.length === 0) return items;
	const asked = new Set(items.map((item) => item.artwork_id));
	const dated = pool.find(
		(row) => cardOf(row) && row.era_code && row.year_to !== null && !asked.has(row.id)
	);
	const spaced = [];
	for (const row of [...pool].sort((a, b) => (a.year_to ?? 0) - (b.year_to ?? 0))) {
		const last = spaced.at(-1);
		if (row.year_to === null) continue;
		if (!last || row.year_to - (last.year_to ?? 0) >= 30) spaced.push(row);
	}
	const order =
		spaced.length >= 4
			? [
					{
						mode: 'order',
						artwork_ids: [spaced[2], spaced[0], spaced[3], spaced[1]].map((row) => row.id)
					}
				]
			: [];
	if (!dated) return [items[0], ...order, ...items.slice(1)];
	return [
		items[0],
		{ artwork_id: dated.id, mode: 'year', card: null },
		...order,
		...items.slice(1)
	];
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

function termMentions(needles) {
	const phrases = (needles ?? []).map((phrase) => phrase.trim().toLowerCase()).filter(Boolean);
	const names = new Map(VALUE_USAGE.map((value) => [value.id, value.name]));
	return notesMentions(undefined)
		.map((row) => (row.kind === 'artwork' ? row : { ...row, title: names.get(row.id) ?? null }))
		.filter((row) => phrases.some((phrase) => row.notes.toLowerCase().includes(phrase)));
}

const LINK_PATTERN = /\]\(\/atelier\/(?:(\d{1,9})|values\/([a-z]+)\/([A-Za-z0-9_-]+))\)/g;

function linkTargets(notes) {
	return [...(notes ?? '').matchAll(LINK_PATTERN)].map(([, number, kind, id]) =>
		number ? { kind: 'artwork', number: Number(number) } : { kind, id }
	);
}

function linkingNotes() {
	const names = new Map(VALUE_USAGE.map((value) => [value.id, value.name]));
	const visits = VISITS.map((row) => ({
		kind: 'visit',
		id: row.id,
		record_number: null,
		title: `${row.category_values.name} · ${row.visited_on.split('-').reverse().join('.')}`,
		notes: row.notes
	}));
	return [...notesMentions(undefined), ...visits].map((row) =>
		row.kind === 'artwork' || row.kind === 'visit'
			? row
			: { ...row, title: names.get(row.id) ?? null }
	);
}

function linksTo(target, args) {
	if (args.artwork_number !== undefined) return target.number === args.artwork_number;
	if (args.value_id !== undefined) return target.kind !== 'era' && target.id === args.value_id;
	return target.kind === 'era' && target.id === args.era_code;
}

function noteLinkMentions(args) {
	return linkingNotes()
		.filter((row) => row.notes && linkTargets(row.notes).some((target) => linksTo(target, args)))
		.map(({ kind, id, record_number, title }) => ({ kind, id, record_number, title }));
}

const SUGGESTED_KINDS = ['period', 'style', 'material', 'author', 'location'];

function searchKey(text) {
	return text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase();
}

function noteLinkSuggestions({ link_trigger: trigger, phrase }) {
	const term = searchKey(phrase ?? '');
	if (trigger === '#') {
		return ARTWORKS.filter((row) => !row.deleted_at)
			.map((row) => {
				const authors = row.artwork_values
					.map(({ category_values: value }) => value)
					.filter((value) => value.category_code === 'author')
					.map((value) => value.name);
				return { row, authors, key: searchKey(`${row.title} ${authors.join(' ')}`) };
			})
			.filter(
				({ row, key }) =>
					(/^\d+$/.test(term) && String(row.record_number).startsWith(String(Number(term)))) ||
					key.includes(term)
			)
			.slice(0, 8)
			.map(({ row, authors }) => ({
				kind: 'artwork',
				id: row.id,
				record_number: row.record_number,
				title: row.title,
				authors,
				parents: []
			}));
	}
	return VALUE_USAGE.filter(
		(value) => SUGGESTED_KINDS.includes(value.category_code) && searchKey(value.name).includes(term)
	)
		.slice(0, 8)
		.map((value) => ({
			kind: value.category_code,
			id: value.id,
			record_number: null,
			title: value.name,
			authors: [],
			parents: []
		}));
}

function noteLinkLabels(args) {
	const source = linkingNotes().find((row) =>
		args.artwork_number !== undefined
			? row.record_number === args.artwork_number
			: row.id === (args.value_id ?? args.era_code ?? args.visit_id)
	);
	const names = new Map(VALUE_USAGE.map((value) => [value.id, value]));
	return linkTargets(source?.notes).flatMap((target) => {
		if (target.kind === 'artwork') {
			const artwork = ARTWORKS.find((row) => row.record_number === target.number);
			return artwork
				? [
						{
							kind: 'artwork',
							id: artwork.id,
							record_number: artwork.record_number,
							title: artwork.title
						}
					]
				: [];
		}
		if (target.kind === 'era')
			return [{ kind: 'era', id: target.id, record_number: null, title: null }];
		const value = names.get(target.id);
		return value
			? [{ kind: value.category_code, id: value.id, record_number: null, title: value.name }]
			: [];
	});
}

function pinsRoute(route, request, url) {
	if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: corsHeaders() });
	if (request.method() !== 'GET') return json(route, [ARTWORK_PINS[0]], 201);
	const entry = url.searchParams.get('glossary_entry_id');
	if (entry) {
		return json(
			route,
			ARTWORK_PINS.filter((row) => `eq.${row.glossary_entry_id}` === entry).map((row) => {
				const artwork = ARTWORKS.find((candidate) =>
					candidate.artwork_images.some((image) => image.id === row.image_id)
				);
				const image = artwork.artwork_images.find((candidate) => candidate.id === row.image_id);
				return { ...row, artwork_images: { ...image, artwork_id: artwork.id } };
			})
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
	const select = url.searchParams.get('select') ?? '*';
	const rows = (
		id?.startsWith('eq.')
			? GLOSSARY_ENTRIES.filter((row) => row.id === id.slice(3))
			: id?.startsWith('in.(')
				? GLOSSARY_ENTRIES.filter((row) => id.slice(4, -1).split(',').includes(row.id))
				: GLOSSARY_ENTRIES
	)
		.map((row) => ({ ...row, has_definition: Boolean(row.definition?.trim()) }))
		.map((row) =>
			select === '*'
				? row
				: Object.fromEntries(select.split(',').map((column) => [column.trim(), row[column.trim()]]))
		);
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
	const placeId = url.searchParams.get('place_id');
	const number = url.searchParams.get('visit_artworks.artworks.record_number');
	const artworkId = number?.startsWith('eq.')
		? `00000000-0000-4000-8000-${number.slice(3).padStart(12, '0')}`
		: null;
	const rows = VISITS.filter(
		(row) =>
			(!id?.startsWith('eq.') || row.id === id.slice(3)) &&
			(!placeId?.startsWith('eq.') || row.place_id === placeId.slice(3)) &&
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
		if (url.pathname === '/storage/v1/object/sign/artwork-images' && request.method() === 'POST') {
			const { paths = [] } = request.postDataJSON() ?? {};
			return json(
				route,
				paths.map((path) => ({
					path,
					signedURL: `/object/sign/artwork-images/${path}?token=mock`,
					error: null
				}))
			);
		}
		if (url.pathname.startsWith('/storage/v1/object/sign/')) {
			return route.fulfill({
				status: 200,
				contentType: 'image/svg+xml',
				headers: corsHeaders(),
				body: imageSvg(url.pathname, 1, 1)
			});
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
		if (url.pathname === '/rest/v1/rpc/card_index') {
			const values = [
				...VALUE_USAGE.filter((row) => !OWN_FIELDS.some((field) => field.id === row.category_code)),
				...OWN_VALUE_USAGE
			].map((row) => {
				const author = VALUE_DETAILS.author_details.find((detail) => detail.value_id === row.id);
				const place = VALUE_DETAILS.location_details.find((detail) => detail.value_id === row.id);
				return {
					visit_count: 0,
					...row,
					...(author?.sort_name ? { sort_name: author.sort_name } : {}),
					...(author?.birth_year ? { birth_year: author.birth_year } : {}),
					...(place?.country_code ? { country_code: place.country_code } : {}),
					...(place?.place_type ? { place_type: place.place_type } : {})
				};
			});
			return json(route, {
				values,
				period_eras: PERIOD_ERA_USAGE,
				style_periods: STYLE_PERIOD_USAGE
			});
		}
		if (url.pathname === '/rest/v1/rpc/artwork_field_usage') return json(route, OWN_FIELD_USAGE);
		if (url.pathname === '/rest/v1/rpc/used_category_values') {
			const names = new Map(
				[
					...VALUE_USAGE.filter(
						(row) => !OWN_FIELDS.some((field) => field.id === row.category_code)
					),
					...OWN_VALUE_USAGE,
					...VISITS.map((visit) => ({
						category_code: 'location',
						name: visit.category_values.name
					}))
				].map((row) => [`${row.category_code}:${row.name}`, row])
			);
			return json(
				route,
				[...names.values()].map(({ category_code, name }) => ({ category_code, name }))
			);
		}
		if (url.pathname === '/rest/v1/rpc/duplicate_candidates') {
			const title = request.postDataJSON()?.title?.trim().toLowerCase();
			return json(
				route,
				ARTWORKS.filter((row) => row.title.toLowerCase() === title).map((row) => ({
					id: row.id,
					record_number: row.record_number,
					title: row.title,
					authors: row.artwork_values
						.filter(({ category_values: value }) => value.category_code === 'author')
						.map(({ category_values: value }) => value.name)
				}))
			);
		}
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
		if (url.pathname === '/rest/v1/rpc/atelier_empty') return json(route, false);
		if (url.pathname === '/rest/v1/rpc/note_gap_artwork') {
			const excluded = request.postDataJSON()?.excluded ?? [];
			const row = ARTWORKS.find((artwork) => hasImage(artwork) && !excluded.includes(artwork.id));
			const notes = 'Apsyda zamyka nawę od wschodu.\n\nNad ołtarzem głowica z szerokim abakusem.';
			return json(route, row ? { id: row.id, notes } : null);
		}
		if (url.pathname === '/rest/v1/rpc/collection_statistics') {
			return json(route, collectionStatistics());
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
		if (url.pathname === '/rest/v1/rpc/note_link_mentions') {
			return json(route, noteLinkMentions(request.postDataJSON() ?? {}));
		}
		if (url.pathname === '/rest/v1/rpc/note_link_labels') {
			return json(route, noteLinkLabels(request.postDataJSON() ?? {}));
		}
		if (url.pathname === '/rest/v1/rpc/note_link_suggestions') {
			return json(route, noteLinkSuggestions(request.postDataJSON() ?? {}));
		}
		if (url.pathname === '/rest/v1/rpc/term_mentions') {
			return json(route, termMentions(request.postDataJSON()?.needles));
		}
		if (url.pathname === '/rest/v1/rpc/record_right_answer') {
			return route.fulfill({ status: 204, headers: corsHeaders() });
		}
		if (url.pathname === '/rest/v1/rpc/record_review') {
			return route.fulfill({ status: 204, headers: corsHeaders() });
		}
		if (url.pathname === '/rest/v1/review_cards') {
			const settled = Number(url.searchParams.get('stability')?.replace(/^gte\./, '') ?? '');
			if (!Number.isFinite(settled) || settled === 0) return json(route, REVIEW_CARDS);
			return json(
				route,
				REVIEW_CARDS.filter((row) => row.stability >= settled)
			);
		}
		if (url.pathname === '/rest/v1/rpc/unlock_exhibits') return json(route, EXHIBITS);
		if (url.pathname === '/rest/v1/rpc/career_standing') {
			const newTiers = EXHIBIT_TIERS.filter((row) => !row.seen_at).length;
			return json(route, [
				{ points: 1846, new_tiers: newTiers, rank_seen: PROFILE.rank_seen ?? 0 }
			]);
		}
		if (url.pathname === '/rest/v1/exhibit_tiers') {
			if (request.method() === 'PATCH') return json(route, []);
			const unseen = url.searchParams.get('seen_at') === 'is.null';
			return json(
				route,
				unseen ? EXHIBIT_TIERS.filter((row) => row.seen_at === null) : EXHIBIT_TIERS
			);
		}
		if (url.pathname === '/rest/v1/timeline_events') {
			if (request.method() === 'POST') return json(route, { id: TIMELINE_EVENTS[0].id }, 201);
			if (request.method() === 'PATCH') return json(route, { id: TIMELINE_EVENTS[0].id });
			const single = url.searchParams.get('id');
			const id = single?.startsWith('eq.') ? single.slice(3) : undefined;
			if (id) return json(route, TIMELINE_EVENTS.find((row) => row.id === id) ?? null);
			const after = Number(url.searchParams.get('year_to')?.replace(/^gte\./, '') ?? '');
			const before = Number(
				url.searchParams.get('or')?.match(/year_from\.lte\.(-?\d+)/)?.[1] ?? ''
			);
			if (Number.isFinite(after) && Number.isFinite(before) && url.searchParams.has('or')) {
				const except = url.searchParams.get('id')?.replace(/^neq\./, '');
				return json(
					route,
					TIMELINE_EVENTS.filter(
						(row) =>
							row.year_to >= after && (row.year_from ?? row.year_to) <= before && row.id !== except
					)
				);
			}
			return json(route, TIMELINE_EVENTS);
		}
		if (url.pathname === '/rest/v1/visits') return visitsRoute(route, request, url);
		if (url.pathname === '/rest/v1/rpc/save_visit') return json(route, VISITS[0].id);
		if (url.pathname === '/rest/v1/catalogue_museums') return json(route, CATALOGUE_MUSEUMS);
		if (
			url.pathname === '/rest/v1/location_details' &&
			url.searchParams.get('country_code') === 'not.is.null' &&
			url.searchParams.get('select') !== 'value_id,country_code'
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
		if (url.searchParams.get('select') === 'value_id,sort_name,birth_year') {
			return json(
				route,
				VALUE_DETAILS.author_details.map(({ value_id, sort_name, birth_year }) => ({
					value_id,
					sort_name: sort_name ?? null,
					birth_year: birth_year ?? null
				}))
			);
		}
		if (url.searchParams.get('select') === 'value_id,country_code') {
			return json(
				route,
				VALUE_DETAILS.location_details.filter((row) => row.country_code)
			);
		}
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
		if (!folder) continue;
		const executable = ['chrome-linux', 'chrome-linux64']
			.map((build) => path.join(root, folder, build, 'chrome'))
			.find((candidate) => existsSync(candidate));
		if (executable) return executable;
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
	const requests = options.logRequests ? logRequests(page) : undefined;
	await page.goto(new URL(options.route, base).href, { waitUntil: 'networkidle' });
	if (options.wait) await page.waitForSelector(options.wait);
	if (options.script) await page.evaluate(readFileSync(path.resolve(options.script), 'utf8'));
	if (options.steps) {
		requests?.setPhase('steps');
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
	if (requests) {
		const entries = await requests.finish();
		const log = path.join(options.out, `${options.name}-${name}-requests.json`);
		writeFileSync(
			log,
			`${JSON.stringify({ route: options.route, viewport: name, entries }, null, 2)}\n`
		);
		process.stdout.write(summarise(name, entries));
	}
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

function collectionStatistics() {
	const day = 24 * 60 * 60 * 1000;
	const today = new Date(new Date().toISOString().slice(0, 10));
	const first = new Date(today.getTime() - 13 * day);
	const pins = new Map();
	for (const row of ARTWORK_PINS) pins.set(row.image_id, (pins.get(row.image_id) ?? 0) + 1);
	const [pinnedImage, pinCount] = [...pins].sort((a, b) => b[1] - a[1])[0] ?? [];
	const pinned = ARTWORKS.find((row) =>
		row.artwork_images.some((image) => image.id === pinnedImage)
	);
	const visit = [...VISITS].sort((a, b) => b.visit_artworks.length - a.visit_artworks.length)[0];
	return {
		terms: GLOSSARY_ENTRIES.length,
		events: TIMELINE_EVENTS.length,
		visits: VISITS.length,
		quiz_answers: REVIEW_CARDS.length > 0 ? 106 : 0,
		correct_answers: REVIEW_CARDS.length > 0 ? 83 : 0,
		most_reviewed: REVIEW_CARDS.slice(0, 4).map((card, index) => ({
			artwork_id: card.artwork_id,
			times: 12 - index * 2
		})),
		growth:
			ARTWORKS.length > 0
				? {
						unit: 'day',
						first_day: first.toISOString().slice(0, 10),
						buckets: Array.from({ length: 14 }, (_, index) => ({
							start: new Date(first.getTime() + index * day).toISOString().slice(0, 10),
							added: index === 0 ? Math.ceil(ARTWORKS.length / 2) : index % 3 === 0 ? 2 : 0
						}))
					}
				: null,
		authors_with_years: ARTWORKS.length > 0 ? 2 : 0,
		longest_lived:
			ARTWORKS.length > 0
				? {
						value_id: valueId('author', 'Rembrandt'),
						name: 'Rembrandt',
						birth_year: 1606,
						death_year: 1669,
						years_approximate: false,
						tied: 0
					}
				: null,
		most_pinned: pinned ? { artwork_id: pinned.id, pins: pinCount, tied: 0 } : null,
		largest_visit: visit
			? {
					visit_id: visit.id,
					place: visit.category_values.name,
					visited_on: visit.visited_on,
					date_precision: visit.date_precision,
					artworks: visit.visit_artworks.length,
					tied: 0
				}
			: null
	};
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
