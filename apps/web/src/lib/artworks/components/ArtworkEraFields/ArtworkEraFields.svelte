<script lang="ts">
	import { ChoiceTiles, ValueField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { VALUE_NAME_MAX_LENGTH } from '#lib/card-index/category-values/category-values.ts';
	import { suggestValues, valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
	import { eraTiles, isEraCode } from '#lib/catalogue/eras/eras.ts';
	import type { ArtworkFormState } from '#lib/artworks/types/artwork-form-state.ts';
	import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
	import type { ValueSuggestion } from '#lib/card-index/types/value-suggestion.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';

	type Props = {
		form: ArtworkFormState;
		valueLinks: ValueLinks;
	};

	let { form = $bindable(), valueLinks }: Props = $props();

	const eraOptions = eraTiles();

	let periodLocked = $derived(form.eraCode === null);
	let styleLocked = $derived(form.values.period.length === 0);

	function suggestions(code: 'period' | 'style', existing: readonly string[]): ValueSuggestion[] {
		return suggestValues({ query: form.queries[code], existing, selected: form.values[code] });
	}

	function periodOptions(): ValueSuggestion[] {
		return suggestions('period', form.eraCode ? valueLinks.periodsByEra[form.eraCode] : []);
	}

	function styleOptions(): ValueSuggestion[] {
		const period = form.values.period[0];
		return suggestions('style', period ? (valueLinks.stylesByPeriod[valueKey(period)] ?? []) : []);
	}

	function clearStyles(): void {
		form.values.style = [];
		form.queries.style = '';
	}

	function clearPeriod(): void {
		form.values.period = [];
		form.queries.period = '';
		clearStyles();
	}

	function chooseEra(code: string | null): void {
		const next: EraCode | null = isEraCode(code) ? code : null;
		if (form.eraCode !== null && next !== form.eraCode) clearPeriod();
		form.eraCode = next;
	}

	function choosePeriod(values: string[]): void {
		const previous = form.values.period[0];
		form.values.period = values;
		if (previous !== undefined && previous !== values[0]) clearStyles();
	}
</script>

<ChoiceTiles
	clearable
	label={m.artworkForm.era}
	onchange={chooseEra}
	options={eraOptions}
	value={form.eraCode}
/>

<ValueField
	label={m.artworkForm.period}
	locked={periodLocked}
	maxlength={VALUE_NAME_MAX_LENGTH}
	options={periodOptions()}
	placeholder={periodLocked ? m.artworkForm.periodLocked : undefined}
	single
	bind:query={form.queries.period}
	bind:values={() => form.values.period, choosePeriod}
/>

<ValueField
	label={m.artworkForm.style}
	locked={styleLocked}
	maxlength={VALUE_NAME_MAX_LENGTH}
	options={styleOptions()}
	placeholder={styleLocked ? m.artworkForm.styleLocked : undefined}
	bind:query={form.queries.style}
	bind:values={form.values.style}
/>
