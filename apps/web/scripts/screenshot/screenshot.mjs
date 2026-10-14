import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
	ARTWORKS,
	IMAGE_HOST,
	SUPABASE_URL,
	TRASHED,
	USER,
	commonsSize,
	fakeSession,
	imageSvg
} from './fixtures.mjs';

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPO_DIR = path.resolve(WEB_DIR, '../..');
const PORT = 5199;
const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/update-password'];
const VIEWPORTS = {
	desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
	phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};
const USAGE = `Usage: pnpm screenshot <path> [options]

  <path>             route to render, for example /atelier or /atelier/1
  --out <dir>        output folder (default tmp/screenshots in the repository)
  --name <name>      file name prefix (default derived from the path)
  --viewport <v>     desktop, phone or both (default both)
  --combine          also write one image with the desktop and phone shots side by side
  --full-page        capture the whole page, not only the first screen
  --signed-out       do not inject the fake session (default for the auth routes)
  --storage k=v      set a localStorage entry before the page loads (repeatable)
  --wait <selector>  wait for this selector before capturing
  --script <file>    run this JavaScript file in the page before capturing, for example to mock a variant
  --url <base>       use a running dev server instead of starting one
`;

function parseArgs(argv) {
	const options = { storage: {}, viewport: 'both', out: path.join(REPO_DIR, 'tmp/screenshots') };
	const rest = [...argv];
	while (rest.length > 0) {
		const arg = rest.shift();
		if (arg === '--') continue;
		if (arg === '--help' || arg === '-h') options.help = true;
		else if (arg === '--combine') options.combine = true;
		else if (arg === '--full-page') options.fullPage = true;
		else if (arg === '--signed-out') options.signedOut = true;
		else if (['--out', '--name', '--viewport', '--wait', '--url', '--script'].includes(arg)) {
			options[arg.slice(2)] = rest.shift();
		} else if (arg === '--storage') {
			const [key, ...value] = (rest.shift() ?? '').split('=');
			options.storage[key] = value.join('=');
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
	return rows;
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
		if (url.pathname.startsWith('/rest/v1/rpc/')) {
			return json(route, { id: ARTWORKS[0].id, record_number: ARTWORKS[0].record_number });
		}
		if (url.pathname === '/rest/v1/artworks') {
			const rows = filteredRows(url);
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

	await context.route(/^https:\/\/upload\.wikimedia\.org\//, (route) => {
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
						thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/${encoded}/500px-${encoded}`,
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

	await context.route(/^https:\/\/(query\.wikidata|www\.wikidata)\.org\//, (route) =>
		json(route, { results: { bindings: [] }, search: [], entities: {} })
	);
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
		({ key, session, entries }) => {
			if (session) localStorage.setItem(key, JSON.stringify(session));
			for (const [entryKey, value] of Object.entries(entries)) {
				localStorage.setItem(entryKey, value);
			}
		},
		{
			key: `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`,
			session: signedOut ? null : fakeSession(),
			entries: options.storage
		}
	);
	const page = await context.newPage();
	await page.goto(new URL(options.route, base).href, { waitUntil: 'networkidle' });
	if (options.wait) await page.waitForSelector(options.wait);
	if (options.script) await page.evaluate(readFileSync(path.resolve(options.script), 'utf8'));
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(400);
	const file = path.join(options.out, `${options.name}-${name}.png`);
	await page.screenshot({ path: file, fullPage: Boolean(options.fullPage) });
	await context.close();
	return file;
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
