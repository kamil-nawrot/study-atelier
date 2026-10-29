import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { formatLifeYears } from '#lib/catalogue/years/years.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import {
	emptyValueSummaries,
	summaryKey
} from '#lib/card-index/value-summaries/value-summaries.ts';
import type { ValueSummary } from '#lib/card-index/types/value-summary.ts';
import type { ValueSummaries } from '#lib/card-index/types/value-summaries.ts';

type SummaryRow = { summary: string | null };

type AuthorSummaryRow = SummaryRow & {
	birth_year: number | null;
	death_year: number | null;
	years_approximate: boolean;
};

type ValueRow = {
	category_values: {
		category_code: CategoryCode;
		name: string;
		period_details?: SummaryRow[];
		style_details?: SummaryRow[];
		material_details?: SummaryRow[];
		author_details?: AuthorSummaryRow[];
		location_details?: (SummaryRow & { country_code: string | null })[];
	} | null;
};

const VALUE_COLUMNS =
	'category_values(category_code, name, period_details(summary), style_details(summary), material_details(summary), author_details(summary, birth_year, death_year, years_approximate), location_details(summary, country_code)), artworks!inner(record_number)';

function valueSummary(row: ValueRow): [string, ValueSummary] | null {
	const value = row.category_values;
	if (!value) return null;
	const details = value[`${value.category_code}_details`]?.[0];
	if (!details?.summary) return null;
	const author = value.category_code === 'author' ? value.author_details?.[0] : undefined;
	const lifeYears = author
		? formatLifeYears(author.birth_year, author.death_year, author.years_approximate)
		: undefined;
	return [
		summaryKey(value.category_code, value.name),
		lifeYears ? { summary: details.summary, lifeYears } : { summary: details.summary }
	];
}

export async function loadValueSummaries(number: number): Promise<ValueSummaries> {
	const [values, eras] = await Promise.all([
		supabase.from('artwork_values').select(VALUE_COLUMNS).eq('artworks.record_number', number),
		supabase.from('era_details').select('era_code, summary')
	]);
	if (values.error || eras.error) return emptyValueSummaries();
	const summaries = emptyValueSummaries();
	for (const row of (values.data ?? []) as unknown as ValueRow[]) {
		const entry = valueSummary(row);
		if (entry) summaries.values[entry[0]] = entry[1];
		const place = row.category_values;
		const code =
			place?.category_code === 'location' ? place.location_details?.[0]?.country_code : null;
		if (place && isCountryCode(code)) summaries.countries[place.name] = countryName(code);
	}
	for (const era of eras.data ?? []) {
		if (era.summary) summaries.eras[era.era_code as EraCode] = { summary: era.summary };
	}
	return summaries;
}
