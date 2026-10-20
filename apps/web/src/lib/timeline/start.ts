import { ERA_CODES, isEraCode } from '#lib/collection/eras.ts';
import type { EraCode } from '#lib/collection/types.ts';
import { eras, timeOf } from './time.ts';

const ERA_KEY = 'study-atelier:timeline-era';

type Dated = {
	yearTo: number | null;
};

export function rememberedEra(): EraCode | null {
	try {
		const stored = localStorage.getItem(ERA_KEY);
		return isEraCode(stored) ? stored : null;
	} catch {
		return null;
	}
}

export function rememberEra(code: EraCode): void {
	try {
		localStorage.setItem(ERA_KEY, code);
	} catch {
		return;
	}
}

export function busiestEra(artworks: readonly Dated[]): EraCode {
	const all = eras();
	const counts = new Map<EraCode, number>();
	for (const artwork of artworks) {
		if (artwork.yearTo === null) continue;
		const time = timeOf(artwork.yearTo);
		const era = all.find((candidate) => time >= candidate.start && time < candidate.end);
		if (era) counts.set(era.code, (counts.get(era.code) ?? 0) + 1);
	}
	let best: EraCode = 'early_modern';
	let most = 0;
	for (const code of ERA_CODES) {
		const count = counts.get(code) ?? 0;
		if (count > most) {
			best = code;
			most = count;
		}
	}
	return best;
}

export function startEra(artworks: readonly Dated[], remembered: EraCode | null): EraCode {
	return remembered ?? busiestEra(artworks);
}

export function eraOfYear(year: number): EraCode {
	const time = timeOf(year);
	const all = eras();
	if (time < all[0].start) return all[0].code;
	return (all.find((era) => time >= era.start && time < era.end) ?? all[all.length - 1]).code;
}
