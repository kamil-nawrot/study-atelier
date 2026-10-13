import { locale } from '#lib/i18n/index.ts';
import { ERA_CODES } from './eras.ts';
import { valueKey } from './value-suggestions.ts';
import type {
	CardIndexData,
	CardIndexEntry,
	CardIndexPeriod,
	CardIndexRecord,
	CardIndexTimeline,
	CategoryCode,
	EraCode,
	EraMove,
	NameChange
} from './types.ts';

export const CARD_INDEX_LIST_CATEGORIES = ['material', 'author', 'location'] as const;

export function emptyCardIndex(): CardIndexData {
	return { values: [], periodEras: [], stylePeriods: [] };
}

function byName<T extends { name: string }>(a: T, b: T): number {
	return a.name.localeCompare(b.name, locale);
}

function entry(record: CardIndexRecord): CardIndexEntry {
	return { id: record.id, name: record.name, count: record.count };
}

export function valuesOf(data: CardIndexData, category: CategoryCode): CardIndexRecord[] {
	return data.values.filter((value) => value.category === category).sort(byName);
}

export function findRecord(data: CardIndexData, id: string): CardIndexRecord | undefined {
	return data.values.find((value) => value.id === id);
}

export function buildTimeline(data: CardIndexData): CardIndexTimeline {
	const styleRecords = new Map(valuesOf(data, 'style').map((style) => [style.id, style]));

	const stylesOf = (periodId: string): CardIndexEntry[] =>
		data.stylePeriods
			.filter((link) => link.periodId === periodId)
			.flatMap((link) => {
				const style = styleRecords.get(link.styleId);
				return style ? [entry(style)] : [];
			})
			.sort(byName);

	const periods = new Map(
		valuesOf(data, 'period').map((period): [string, CardIndexPeriod] => [
			period.id,
			{ ...entry(period), styles: stylesOf(period.id) }
		])
	);

	const withEra = new Set(data.periodEras.map((link) => link.periodId));
	const withPeriod = new Set(data.stylePeriods.map((link) => link.styleId));

	return {
		eras: ERA_CODES.map((code) => ({
			code,
			periods: data.periodEras
				.filter((link) => link.eraCode === code)
				.flatMap((link) => {
					const period = periods.get(link.periodId);
					return period ? [period] : [];
				})
				.sort(byName)
		})),
		periodsWithoutEra: [...periods.values()].filter((period) => !withEra.has(period.id)),
		stylesWithoutPeriod: [...styleRecords.values()]
			.filter((style) => !withPeriod.has(style.id))
			.map(entry)
	};
}

export function erasOfPeriod(data: CardIndexData, periodId: string): EraCode[] {
	const eras = new Set(
		data.periodEras.filter((link) => link.periodId === periodId).map((link) => link.eraCode)
	);
	return ERA_CODES.filter((code) => eras.has(code));
}

export function periodsOfStyle(data: CardIndexData, styleId: string): CardIndexRecord[] {
	const ids = new Set(
		data.stylePeriods.filter((link) => link.styleId === styleId).map((link) => link.periodId)
	);
	return valuesOf(data, 'period').filter((period) => ids.has(period.id));
}

export function planNameChange(
	record: CardIndexRecord,
	input: string,
	data: CardIndexData
): NameChange {
	const name = input.trim();
	if (!name) return { kind: 'empty' };

	const key = valueKey(name);
	const same = data.values.find(
		(value) =>
			value.category === record.category && value.id !== record.id && valueKey(value.name) === key
	);
	if (same) return { kind: 'merge', target: same };

	return name === record.name ? { kind: 'unchanged' } : { kind: 'rename', name };
}

export function planEraMove(
	data: CardIndexData,
	periodId: string,
	wanted: readonly EraCode[]
): EraMove {
	const current = erasOfPeriod(data, periodId);
	const removed = current.filter((code) => !wanted.includes(code));
	const count = data.periodEras
		.filter((link) => link.periodId === periodId && removed.includes(link.eraCode))
		.reduce((sum, link) => sum + link.count, 0);
	return { count, removed, remaining: ERA_CODES.filter((code) => wanted.includes(code)) };
}

export function lockedPeriodIds(data: CardIndexData, styleId: string): Map<string, number> {
	return new Map(
		data.stylePeriods
			.filter((link) => link.styleId === styleId && link.count > 0)
			.map((link) => [link.periodId, link.count])
	);
}

export function canDelete(record: CardIndexRecord): boolean {
	return record.count === 0;
}
