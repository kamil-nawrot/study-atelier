import { supabase } from '#lib/supabase.ts';
import { emptyCardIndex } from './card-index.ts';
import { isEraCode } from './eras.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from './errors.ts';
import type { CardIndexRecord, CardIndexResult, CategoryCode, EraCode } from './types.ts';

const PAGE_SIZE = 1000;

type ErrorLike = { code?: string; message?: string };

type Page = PromiseLike<{ data: unknown; error: ErrorLike | null }>;

type UsageRow = {
	id: string;
	category_code: CategoryCode;
	name: string;
	artwork_count: number;
};

type PeriodEraRow = { period_id: string; era_code: string; artwork_count: number };

type StylePeriodRow = { style_id: string; period_id: string; artwork_count: number };

export type CardIndexActionResult = {
	error?: string;
};

async function fetchAll<T>(
	page: (from: number, to: number) => Page
): Promise<{ rows: T[]; error?: ErrorLike }> {
	const rows: T[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await page(from, from + PAGE_SIZE - 1);
		if (error) return { rows: [], error };
		const received = (data ?? []) as T[];
		rows.push(...received);
		if (received.length < PAGE_SIZE) return { rows };
	}
}

export async function loadCardIndex(): Promise<CardIndexResult> {
	const [values, periodEras, stylePeriods] = await Promise.all([
		fetchAll<UsageRow>((from, to) => supabase.rpc('value_usage').range(from, to)),
		fetchAll<PeriodEraRow>((from, to) => supabase.rpc('period_era_usage').range(from, to)),
		fetchAll<StylePeriodRow>((from, to) => supabase.rpc('style_period_usage').range(from, to))
	]);
	const error = values.error ?? periodEras.error ?? stylePeriods.error;
	if (error) return { index: emptyCardIndex(), error: collectionErrorMessage(error) };

	return {
		index: {
			values: values.rows.map((row): CardIndexRecord => ({
				id: row.id,
				category: row.category_code,
				name: row.name,
				count: row.artwork_count
			})),
			periodEras: periodEras.rows
				.filter((row) => isEraCode(row.era_code))
				.map((row) => ({
					periodId: row.period_id,
					eraCode: row.era_code as EraCode,
					count: row.artwork_count
				})),
			stylePeriods: stylePeriods.rows.map((row) => ({
				styleId: row.style_id,
				periodId: row.period_id,
				count: row.artwork_count
			}))
		}
	};
}

export type ValueChanges = {
	record: CardIndexRecord;
	name: string;
	eraCodes?: EraCode[];
	moveTo?: EraCode;
	periodIds?: string[];
	mergeInto?: CardIndexRecord;
};

async function run(call: PromiseLike<{ error: ErrorLike | null }>): Promise<CardIndexActionResult> {
	const { error } = await call;
	return error ? { error: cardIndexErrorMessage(error) } : {};
}

export async function saveValue(changes: ValueChanges): Promise<CardIndexActionResult> {
	const { record } = changes;

	if (record.category === 'period' && changes.eraCodes) {
		const result = await run(
			supabase.rpc('set_period_eras', {
				target_period: record.id,
				era_codes: changes.eraCodes,
				move_to: changes.moveTo ?? undefined
			})
		);
		if (result.error) return result;
	}

	if (record.category === 'style' && changes.periodIds) {
		const result = await run(
			supabase.rpc('set_style_periods', {
				target_style: record.id,
				period_ids: changes.periodIds
			})
		);
		if (result.error) return result;
	}

	if (changes.mergeInto) {
		return run(
			supabase.rpc('merge_category_values', {
				merged_id: record.id,
				kept_id: changes.mergeInto.id
			})
		);
	}

	if (changes.name !== record.name) {
		return run(supabase.from('category_values').update({ name: changes.name }).eq('id', record.id));
	}

	return {};
}

export function deleteValue(id: string): Promise<CardIndexActionResult> {
	return run(supabase.rpc('delete_unused_value', { target_value: id }));
}
