import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';
import { cacheKeys, cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { isCategoryCode } from '#lib/card-index/category-values/category-values.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { isPlaceType } from '#lib/catalogue/place-types/place-types.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';

type CardIndexResult = {
	index: CardIndexData;
	ownValues: OwnValue[];
	error?: string;
};

type UsageRow = {
	id: string;
	category_code: string;
	name: string;
	artwork_count: number;
	visit_count?: number;
};

type PeriodEraRow = { period_id: string; era_code: string; artwork_count: number };

type StylePeriodRow = { style_id: string; period_id: string; artwork_count: number };

type CardIndexActionResult = {
	error?: string;
};

type ValuePageContent = {
	hasContent: boolean;
	ownImagePath?: string;
};

type ValuePageContentResult = {
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

export function loadCardIndex(): Promise<CardIndexResult> {
	return cached(cacheKeys.cardIndex, fetchCardIndex);
}

type CardIndexRow = {
	values: (UsageRow & {
		sort_name?: string;
		birth_year?: number;
		country_code?: string;
		place_type?: string;
	})[];
	period_eras: PeriodEraRow[];
	style_periods: StylePeriodRow[];
};

function recordOf(row: CardIndexRow['values'][number]): CardIndexRecord[] {
	if (!isCategoryCode(row.category_code)) return [];
	return [
		{
			id: row.id,
			category: row.category_code,
			name: row.name,
			count: row.artwork_count,
			...(row.visit_count ? { visits: row.visit_count } : {}),
			...(row.sort_name ? { sortName: row.sort_name } : {}),
			...(row.birth_year === undefined ? {} : { birthYear: row.birth_year }),
			...(row.country_code ? { countryCode: row.country_code } : {}),
			...(isPlaceType(row.place_type) ? { placeType: row.place_type } : {})
		}
	];
}

async function fetchCardIndex(): Promise<CardIndexResult> {
	const { data, error } = await supabase.rpc('card_index');
	if (error) {
		return { index: emptyCardIndex(), ownValues: [], error: collectionErrorMessage(error) };
	}
	const rows = data as unknown as CardIndexRow;
	return {
		ownValues: ownValuesOf(rows.values),
		index: {
			values: rows.values.flatMap(recordOf),
			periodEras: rows.period_eras
				.filter((row) => isEraCode(row.era_code))
				.map((row) => ({
					periodId: row.period_id,
					eraCode: row.era_code as EraCode,
					count: row.artwork_count
				})),
			stylePeriods: rows.style_periods.map((row) => ({
				styleId: row.style_id,
				periodId: row.period_id,
				count: row.artwork_count
			}))
		}
	};
}

type ValueChanges = {
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
	forgetCached([
		cacheKeys.atelier,
		cacheKeys.cardIndex,
		cacheKeys.categoryValues,
		cacheKeys.valueLinks
	]);
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

export async function createValue(
	category: CategoryCode,
	name: string
): Promise<{ id?: string; error?: string }> {
	const { data, error } = await supabase
		.from('category_values')
		.insert({ category_code: category, name: name.trim() })
		.select('id')
		.single();
	forgetCached([
		cacheKeys.atelier,
		cacheKeys.cardIndex,
		cacheKeys.categoryValues,
		cacheKeys.valueLinks
	]);
	if (error) return { error: await failureMessage(error, cardIndexErrorMessage) };
	return { id: data.id };
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
