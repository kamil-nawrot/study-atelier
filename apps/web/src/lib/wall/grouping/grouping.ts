import { m } from '#lib/i18n/index.ts';
import { ERA_CODES, eraName, isEraCode } from '#lib/catalogue/eras/eras.ts';
import { byYear, groupByAuthor } from '#lib/wall/periods/periods.ts';
import type { PeriodGroup } from '#lib/wall/types/period-group.ts';
import type { WallOrder } from '#lib/wall/types/wall-order.ts';
import type { WallSection } from '#lib/wall/types/wall-section.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

type WallGrouping = 'none' | 'era' | 'period' | 'style';

export const WALL_GROUPINGS: readonly WallGrouping[] = ['none', 'era', 'period', 'style'];

export const GROUPING_PARAM = 'group';

const GROUPING_VALUES: Record<WallGrouping, string> = {
	none: '',
	era: 'era',
	period: 'period',
	style: 'style'
};

const DEPTHS: Record<WallGrouping, number> = { none: 0, era: 1, period: 2, style: 3 };

type Level = {
	prefix: string;
	missing: () => string;
	keysOf: (artwork: WallArtwork) => string[];
};

const LEVELS: Level[] = [
	{
		prefix: 'era',
		missing: () => m.atelier.grouping.noEra,
		keysOf: (artwork) => (artwork.eraCode ? [artwork.eraCode] : [])
	},
	{
		prefix: 'period',
		missing: () => m.atelier.grouping.noPeriod,
		keysOf: (artwork) => (artwork.period ? [artwork.period] : [])
	},
	{
		prefix: 'style',
		missing: () => m.atelier.grouping.noStyle,
		keysOf: (artwork) => artwork.styles
	}
];

const collator = new Intl.Collator('pl');

export function groupingFromParams(params: Pick<URLSearchParams, 'get'>): WallGrouping {
	const value = params.get(GROUPING_PARAM);
	return WALL_GROUPINGS.find((grouping) => value && GROUPING_VALUES[grouping] === value) ?? 'none';
}

export function wallParams(filterParams: URLSearchParams, grouping: WallGrouping): URLSearchParams {
	const params = new URLSearchParams(filterParams);
	if (grouping !== 'none') params.set(GROUPING_PARAM, GROUPING_VALUES[grouping]);
	return params;
}

export function orderWall(artworks: WallArtwork[], order: WallOrder): WallArtwork[] {
	if (order === 'year') return [...artworks].sort(byYear);
	if (order === 'author') return groupByAuthor(artworks).flatMap((group) => group.artworks);
	return artworks;
}

function lowestYear(artworks: WallArtwork[]): number | null {
	const years = artworks.flatMap((artwork) => artwork.yearFrom ?? artwork.yearTo ?? []);
	return years.length > 0 ? Math.min(...years) : null;
}

function byLowestYear(a: WallSection, b: WallSection): number {
	const yearA = lowestYear(a.artworks);
	const yearB = lowestYear(b.artworks);
	if (yearA !== yearB) {
		if (yearA === null) return 1;
		if (yearB === null) return -1;
		return yearA - yearB;
	}
	return collator.compare(a.name, b.name);
}

function collect(artworks: WallArtwork[], level: Level): Map<string | null, WallArtwork[]> {
	const groups = new Map<string | null, WallArtwork[]>();
	for (const artwork of artworks) {
		const keys = level.keysOf(artwork);
		for (const key of keys.length > 0 ? keys : [null]) {
			const members = groups.get(key);
			if (members) members.push(artwork);
			else groups.set(key, [artwork]);
		}
	}
	return groups;
}

function buildSections(
	artworks: WallArtwork[],
	depth: number,
	index: number,
	parentKey: string
): WallSection[] {
	const level = LEVELS[index];
	const groups = collect(artworks, level);
	const build = (key: string | null, members: WallArtwork[]): WallSection => {
		const sectionKey = `${parentKey}${level.prefix}:${key ?? ''}/`;
		const code = index === 0 && isEraCode(key) ? key : null;
		return {
			key: sectionKey,
			level: index + 1,
			code,
			name: key === null ? level.missing() : code ? eraName(code) : key,
			artworks: members,
			sections:
				key !== null && index + 1 < depth
					? buildSections(members, depth, index + 1, sectionKey)
					: []
		};
	};
	const named = [...groups].flatMap(([key, members]) =>
		key === null ? [] : [build(key, members)]
	);
	const ordered =
		index === 0
			? ERA_CODES.flatMap((code) => named.filter((section) => section.code === code))
			: named.sort(byLowestYear);
	const missing = groups.get(null);
	return missing ? [...ordered, build(null, missing)] : ordered;
}

export function groupWall(artworks: WallArtwork[], grouping: WallGrouping): WallSection[] {
	const depth = DEPTHS[grouping];
	return depth === 0 ? [] : buildSections(artworks, depth, 0, '');
}

export function sectionKeys(sections: WallSection[]): string[] {
	return sections.flatMap((section) => [section.key, ...sectionKeys(section.sections)]);
}

export function sectionSequence(sections: WallSection[]): WallArtwork[] {
	const seen = new Set<string>();
	const sequence: WallArtwork[] = [];
	const visit = (section: WallSection): void => {
		if (section.sections.length > 0) {
			section.sections.forEach(visit);
			return;
		}
		for (const artwork of section.artworks) {
			if (seen.has(artwork.id)) continue;
			seen.add(artwork.id);
			sequence.push(artwork);
		}
	};
	sections.forEach(visit);
	return sequence;
}

export type SectionBudget = {
	shown: Map<string, number>;
	complete: boolean;
};

export function allocateTiles(
	sections: WallSection[],
	collapsed: ReadonlySet<string>,
	budget: number
): SectionBudget {
	const shown = new Map<string, number>();
	let left = budget;
	let complete = true;
	const visit = (section: WallSection): void => {
		if (left <= 0) {
			complete = false;
			return;
		}
		if (collapsed.has(section.key) || section.sections.length > 0) {
			shown.set(section.key, 0);
			if (!collapsed.has(section.key)) section.sections.forEach(visit);
			return;
		}
		const taken = Math.min(left, section.artworks.length);
		shown.set(section.key, taken);
		left -= taken;
		if (taken < section.artworks.length) complete = false;
	};
	sections.forEach(visit);
	return { shown, complete };
}

export function railGroups(sections: WallSection[]): PeriodGroup[] {
	return sections.map((section) => {
		const ends = section.artworks.flatMap((artwork) => artwork.yearTo ?? []);
		return {
			key: section.key,
			code: section.code,
			name: section.name,
			from: lowestYear(section.artworks),
			to: ends.length > 0 ? Math.max(...ends) : null,
			artworks: section.artworks
		};
	});
}
