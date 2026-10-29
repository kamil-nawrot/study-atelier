import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';
import { cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { isCategoryCode } from '#lib/card-index/category-values/category-values.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
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

type AuthorRow = { value_id: string; sort_name: string | null; birth_year: number | null };

type PlaceRow = { value_id: string; country_code: string };

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

function valueDetails(
	authors: readonly AuthorRow[],
	places: readonly PlaceRow[]
): Map<string, Partial<CardIndexRecord>> {
	const details = new Map<string, Partial<CardIndexRecord>>();
	for (const author of authors) {
		details.set(author.value_id, {
			...(author.sort_name ? { sortName: author.sort_name } : {}),
			...(author.birth_year !== null ? { birthYear: author.birth_year } : {})
		});
	}
	for (const place of places) details.set(place.value_id, { countryCode: place.country_code });
	return details;
}

export function loadCardIndex(): Promise<CardIndexResult> {
	return cached('card-index', fetchCardIndex);
}

async function fetchCardIndex(): Promise<CardIndexResult> {
	const [values, periodEras, stylePeriods, authors, places] = await Promise.all([
		fetchAll<UsageRow>((from, to) => supabase.rpc('value_usage').range(from, to)),
		fetchAll<PeriodEraRow>((from, to) => supabase.rpc('period_era_usage').range(from, to)),
		fetchAll<StylePeriodRow>((from, to) => supabase.rpc('style_period_usage').range(from, to)),
		fetchAll<AuthorRow>((from, to) =>
			supabase
				.from('author_details')
				.select('value_id, sort_name, birth_year')
				.or('sort_name.not.is.null,birth_year.not.is.null')
				.order('value_id')
				.range(from, to)
		),
		fetchAll<PlaceRow>((from, to) =>
			supabase
				.from('location_details')
				.select('value_id, country_code')
				.not('country_code', 'is', null)
				.order('value_id')
				.range(from, to)
		)
	]);
	const error =
		values.error ?? periodEras.error ?? stylePeriods.error ?? authors.error ?? places.error;
	if (error) {
		return { index: emptyCardIndex(), ownValues: [], error: collectionErrorMessage(error) };
	}

	const details = valueDetails(authors.rows, places.rows);
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
								...(row.visit_count ? { visits: row.visit_count } : {}),
								...details.get(row.id)
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
	forgetCached();
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
	forgetCached();
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
