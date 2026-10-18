import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	adjectiveTable,
	fetchForms,
	lemmaCandidates,
	nounDeclensions,
	nounOf,
	polishSection,
	suggestsForms
} from './wiktionary.ts';

function noun(title: string, gender: string, forms: Record<string, string>, prefix = ''): string {
	const parameters = Object.entries(forms)
		.map(([key, value]) => `|${key} = ${value}`)
		.join('\n');
	return [
		`== ${title} ({{język polski}}) ==`,
		`''rzeczownik, rodzaj ${gender}''`,
		'{{odmiana}}',
		`: (1.1) ${prefix}{{odmiana-rzeczownik-polski`,
		parameters,
		'}}'
	].join('\n');
}

const NAWA = noun('nawa', 'żeński', {
	'Mianownik lp': 'nawa',
	'Dopełniacz lp': 'nawy',
	'Celownik lp': 'nawie',
	'Mianownik lm': 'nawy',
	'Dopełniacz lm': 'naw'
});

const SKLEPIENIE = noun('sklepienie', 'nijaki', {
	'Mianownik lp': 'sklepienie',
	'Dopełniacz lp': 'sklepienia',
	'Mianownik lm': 'sklepienia'
});

const PODZIAL = noun('podział', 'męskorzeczowy', {
	'Mianownik lp': 'podział',
	'Dopełniacz lp': 'podziału'
});

function adjective(title: string): string {
	return `== ${title} ({{język polski}}) ==\n''przymiotnik''\n: (1.1) {{odmiana-przymiotnik-polski}}`;
}

function table(rows: [string, string[]][]): string {
	const header =
		'<tr><th rowspan="2">[[przypadek]]</th><th colspan="4">lp</th><th colspan="2">lm</th></tr>' +
		'<tr><td class="forma">mos/mzw</td><td class="forma">mrz</td><td class="forma">ż</td><td class="forma">n</td><td class="forma">mos</td><td class="forma">nmos</td></tr>';
	const body = rows
		.map(
			([label, cells]) =>
				`<tr><td class="forma">[[${label}]]</td>${cells.map((cell) => (cell.startsWith('2:') ? `<td colspan="2">${cell.slice(2)}</td>` : `<td>${cell}</td>`)).join('')}</tr>`
		)
		.join('');
	return `<table class="wikitable odmiana adj">${header}${body}</table>`;
}

const KRZYZOWY = table([
	['mianownik', ['2:krzyżowy', 'krzyżowa', 'krzyżowe', 'krzyżowi', 'krzyżowe']],
	['dopełniacz', ['2:krzyżowego', 'krzyżowej', 'krzyżowego', '2:krzyżowych']]
]);

const ZLOTY = table([
	['mianownik', ['2:złoty', 'złota', 'złote', 'złoci', 'złote']],
	['dopełniacz', ['2:złotego', 'złotej', 'złotego', '2:złotych']]
]);

function respond(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

function stubWiktionary(
	pages: Record<string, string>,
	tables: Record<string, string> = {}
): ReturnType<typeof vi.fn> {
	const fetchMock = vi.fn(async (input: string | URL | Request) => {
		const url = new URL(String(input));
		if (url.searchParams.get('action') === 'expandtemplates') {
			return respond({
				expandtemplates: { wikitext: tables[url.searchParams.get('title') ?? ''] }
			});
		}
		const title = url.searchParams.get('page') ?? '';
		return title in pages
			? respond({ parse: { title, wikitext: pages[title] } })
			: respond({ error: { code: 'missingtitle' } });
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('suggestsForms', () => {
	it('suggests forms for one or two words in any category but a person', () => {
		expect(suggestsForms('nawa', 'architecture')).toBe(true);
		expect(suggestsForms(' sklepienie  krzyżowe ', 'architecture')).toBe(true);
		expect(suggestsForms('ołtarz z predellą bocznego', 'general')).toBe(false);
		expect(suggestsForms('Giorgio Vasari', 'person')).toBe(false);
		expect(suggestsForms('nawa', null)).toBe(false);
		expect(suggestsForms('  ', 'general')).toBe(false);
	});
});

describe('polishSection', () => {
	it('keeps only the Polish section of a page', () => {
		const page = `{{podobne|Nawa}}\n${NAWA}\n== nawa ({{język czeski}}) ==\n{{odmiana-rzeczownik-czeski}}`;

		expect(polishSection(page)).toContain('nawy');
		expect(polishSection(page)).not.toContain('czeski');
	});

	it('gives nothing for a page without a Polish section', () => {
		expect(polishSection('== impasto ({{język włoski}}) ==\nimpasti')).toBe('');
	});
});

describe('nounDeclensions', () => {
	it('reads every template, splits variants and drops references and comments', () => {
		const section = [
			noun('witraż', 'męskorzeczowy', {
				'Mianownik lp': 'witraż',
				'Dopełniacz lp':
					'witraża<ref name="USJP">{{USJPonline}}</ref> / witrażu<ref name="USJP" /><!-- both -->'
			}),
			noun('witraż', 'męskorzeczowy', { 'Mianownik lm': 'witraże' }, '{{blm}}, ')
		].join('\n');

		const [first, second] = nounDeclensions(section);

		expect(first.get('dopełniacz lp')).toEqual(['witraża', 'witrażu']);
		expect(second.get('mianownik lm')).toEqual(['witraże']);
	});

	it('finds the noun whose nominative is the word, with its gender', () => {
		const found = nounOf(polishSection(SKLEPIENIE), 'Sklepienie');

		expect(found?.gender).toBe('n');
		expect(found?.forms.get('dopełniacz lp')).toEqual(['sklepienia']);
		expect(nounOf(polishSection(SKLEPIENIE), 'krzyżowe')).toBeUndefined();
	});
});

describe('adjectiveTable', () => {
	it('reads the cases and spreads merged cells over their columns', () => {
		const read = adjectiveTable(KRZYZOWY);

		expect(read.get('mianownik')).toEqual([
			'krzyżowy',
			'krzyżowy',
			'krzyżowa',
			'krzyżowe',
			'krzyżowi',
			'krzyżowe'
		]);
		expect(read.get('dopełniacz')?.[5]).toBe('krzyżowych');
	});
});

describe('lemmaCandidates', () => {
	it('tries the word and its masculine endings', () => {
		expect(lemmaCandidates('Krzyżowe')).toEqual(['krzyżowe', 'krzyżowy', 'krzyżowi']);
		expect(lemmaCandidates('złoty')).toEqual(['złoty', 'złoti']);
	});
});

describe('fetchForms', () => {
	it('reads the forms of one word without the name itself', async () => {
		stubWiktionary({ nawa: NAWA });

		expect(await fetchForms('Nawa')).toEqual(['nawy', 'nawie', 'naw']);
	});

	it('takes a two-word phrase that has its own page', async () => {
		const phrase = noun('perspektywa powietrzna', 'żeński', {
			'Mianownik lp': 'perspektywa powietrzna',
			'Dopełniacz lp': 'perspektywy powietrznej'
		});
		const fetchMock = stubWiktionary({ 'perspektywa powietrzna': phrase });

		expect(await fetchForms('perspektywa powietrzna')).toEqual(['perspektywy powietrznej']);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('combines a noun and an adjective case by case in the order of the name', async () => {
		stubWiktionary(
			{ sklepienie: SKLEPIENIE, krzyżowy: adjective('krzyżowy') },
			{ krzyżowy: KRZYZOWY }
		);

		expect(await fetchForms('sklepienie krzyżowe')).toEqual([
			'sklepienia krzyżowego',
			'sklepienia krzyżowe'
		]);
	});

	it('finds the noun in the second word when the adjective comes first', async () => {
		stubWiktionary(
			{
				podział: PODZIAL,
				złoty: `${adjective('złoty')}\n${noun('złoty', 'męskorzeczowy', { 'Mianownik lp': 'złoty' })}`
			},
			{ złoty: ZLOTY }
		);

		expect(await fetchForms('złoty podział')).toEqual(['złotego podziału']);
	});

	it('gives nothing when a word has no page', async () => {
		stubWiktionary({ ołtarz: noun('ołtarz', 'męskorzeczowy', { 'Mianownik lp': 'ołtarz' }) });

		expect(await fetchForms('ołtarz szafowy')).toEqual([]);
	});

	it('fails when Wiktionary does not answer', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => respond({}, 500))
		);

		await expect(fetchForms('nawa')).rejects.toThrow();
	});
});
