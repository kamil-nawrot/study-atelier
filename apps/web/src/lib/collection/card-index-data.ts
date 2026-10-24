import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { removeOwnImage } from '#lib/images/own-image.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyCardIndex } from './card-index.ts';
import { isCategoryCode } from './category-values.ts';
import { isEraCode } from './eras.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from './errors.ts';
import type { CardIndexRecord, CardIndexResult, EraCode, OwnValue } from './types.ts';

type UsageRow = {
	id: string;
	category_code: string;
	name: string;
	artwork_count: number;
};

type SortNameRow = { value_id: string; sort_name: string };

type PeriodEraRow = { period_id: string; era_code: string; artwork_count: number };

type StylePeriodRow = { style_id: string; period_id: string; artwork_count: number };

export type CardIndexActionResult = {
	error?: string;
};

export type ValuePageContent = {
	hasContent: boolean;
	ownImagePath?: string;
};

export type ValuePageContentResult = {
	content?: ValuePageContent;
	error?: string;
};

function ownValuesOf(rows: readonly UsageRow[]): OwnValue[] {
	return rows.flatMap((row): OwnValue[] =>
		isCategoryCode(row.category_code)
			? []
			: [{ id: row.id, fieldId: row.category_code, name: row.name, count: row.artwork_count }]
	);
}

export async function loadOwnValues(): Promise<{ ownValues: OwnValue[]; error?: string }> {
	const { rows, error } = await fetchAll<UsageRow>((from, to) =>
		supabase.rpc('value_usage').range(from, to)
	);
	if (error) return { ownValues: [], error: collectionErrorMessage(error) };
	return { ownValues: ownValuesOf(rows) };
}

export async function loadCardIndex(): Promise<CardIndexResult> {
	const [values, periodEras, stylePeriods, sortNames] = await Promise.all([
		fetchAll<UsageRow>((from, to) => supabase.rpc('value_usage').range(from, to)),
		fetchAll<PeriodEraRow>((from, to) => supabase.rpc('period_era_usage').range(from, to)),
		fetchAll<StylePeriodRow>((from, to) => supabase.rpc('style_period_usage').range(from, to)),
		fetchAll<SortNameRow>((from, to) =>
			supabase
				.from('author_details')
				.select('value_id, sort_name')
				.not('sort_name', 'is', null)
				.range(from, to)
		)
	]);
	const error = values.error ?? periodEras.error ?? stylePeriods.error ?? sortNames.error;
	const sortNameOf = new Map(sortNames.rows.map((row) => [row.value_id, row.sort_name]));
	if (error) {
		return { index: emptyCardIndex(), ownValues: [], error: collectionErrorMessage(error) };
	}

	return {
		ownValues: ownValuesOf(values.rows),
		index: {
			values: values.rows.flatMap((row): CardIndexRecord[] =>
				isCategoryCode(row.category_code)
					? [
							{
								id: row.id,
								category: row.category_code,
								name: row.name,
								count: row.artwork_count,
								...(sortNameOf.get(row.id) ? { sortName: sortNameOf.get(row.id) } : {})
							}
						]
					: []
			),
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

async function run(
	call: PromiseLike<{ error: ServiceError | null }>
): Promise<CardIndexActionResult> {
	const { error } = await call;
	return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
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
		const mergeInto = changes.mergeInto;
		return withPortraitRemoved(record, () =>
			run(
				supabase.rpc('merge_category_values', {
					merged_id: record.id,
					kept_id: mergeInto.id
				})
			)
		);
	}

	if (changes.name !== record.name) {
		return run(supabase.from('category_values').update({ name: changes.name }).eq('id', record.id));
	}

	return {};
}

export function deleteValue(record: CardIndexRecord): Promise<CardIndexActionResult> {
	return withPortraitRemoved(record, () =>
		run(supabase.rpc('delete_unused_value', { target_value: record.id }))
	);
}

export async function loadValuePageContent(id: string): Promise<ValuePageContentResult> {
	const { data, error } = await supabase.rpc('value_page_content', { target_value: id });
	if (error) return { error: await failureMessage(error, cardIndexErrorMessage) };
	const row = data?.[0];
	return {
		content: {
			hasContent: row?.has_content ?? false,
			ownImagePath: row?.own_image_path ?? undefined
		}
	};
}

async function withPortraitRemoved(
	record: CardIndexRecord,
	action: () => Promise<CardIndexActionResult>
): Promise<CardIndexActionResult> {
	if (record.category !== 'author') return action();
	const loaded = await loadValuePageContent(record.id);
	if (loaded.error) return { error: loaded.error };
	const result = await action();
	const path = loaded.content?.ownImagePath;
	if (!result.error && path) await removeOwnImage(path);
	return result;
}
