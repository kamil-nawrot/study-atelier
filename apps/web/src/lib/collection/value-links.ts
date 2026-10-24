import { locale } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { collectionErrorMessage } from './errors.ts';
import { valueKey } from './value-suggestions.ts';
import type { EraCode, ValueLinks, ValueLinksResult } from './types.ts';

type ValueRow = {
	id: string;
	category_code: string;
	name: string;
};

type PeriodEraRow = {
	value_id: string;
	era_code: string;
};

type StylePeriodRow = {
	style_id: string;
	period_id: string;
};

export function emptyValueLinks(): ValueLinks {
	return {
		periodsByEra: {
			prehistory: [],
			antiquity: [],
			middle_ages: [],
			early_modern: [],
			modern: [],
			contemporary: []
		},
		stylesByPeriod: {}
	};
}

function sorted(names: Set<string>): string[] {
	return [...names].sort((a, b) => a.localeCompare(b, locale));
}

export function buildValueLinks(
	values: readonly ValueRow[],
	periodEras: readonly PeriodEraRow[],
	stylePeriods: readonly StylePeriodRow[]
): ValueLinks {
	const names = new Map(values.map((value) => [value.id, value.name]));
	const periods = new Map<EraCode, Set<string>>();
	const styles = new Map<string, Set<string>>();

	for (const link of periodEras) {
		const name = names.get(link.value_id);
		if (name === undefined || !isEraCode(link.era_code)) continue;
		periods.set(link.era_code, (periods.get(link.era_code) ?? new Set()).add(name));
	}

	for (const link of stylePeriods) {
		const style = names.get(link.style_id);
		const period = names.get(link.period_id);
		if (style === undefined || period === undefined) continue;
		const key = valueKey(period);
		styles.set(key, (styles.get(key) ?? new Set()).add(style));
	}

	const links = emptyValueLinks();
	for (const [code, set] of periods) links.periodsByEra[code] = sorted(set);
	for (const [key, set] of styles) links.stylesByPeriod[key] = sorted(set);
	return links;
}

export async function loadValueLinks(): Promise<ValueLinksResult> {
	const [values, periodEras, stylePeriods] = await Promise.all([
		supabase
			.from('category_values')
			.select('id, category_code, name')
			.in('category_code', ['period', 'style']),
		supabase.from('period_eras').select('value_id, era_code'),
		supabase.from('style_periods').select('style_id, period_id')
	]);
	const error = values.error ?? periodEras.error ?? stylePeriods.error;
	if (error) return { links: emptyValueLinks(), error: collectionErrorMessage(error) };

	return {
		links: buildValueLinks(values.data ?? [], periodEras.data ?? [], stylePeriods.data ?? [])
	};
}
