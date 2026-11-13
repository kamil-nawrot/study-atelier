<script lang="ts">
	import { ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { loadTowns } from '#lib/map/geography/geography.ts';
	import { cityOptions } from '#lib/values/city-options/city-options.ts';
	import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
	import type { Town } from '#lib/map/types/town.ts';
	import type { PlaceCity } from '#lib/values/types/place-city.ts';

	type Props = {
		cities: readonly CardIndexRecord[];
		city: PlaceCity | null;
		onchange: (city: PlaceCity | null) => void;
	};

	let { cities, city, onchange }: Props = $props();

	let towns = $state<Town[]>([]);
	let query = $state('');
	let found = $derived(cityOptions(query, cities, towns));

	$effect(() => {
		loadTowns().then(
			(loaded) => (towns = loaded),
			() => (towns = [])
		);
	});

	function pick(option: ValueOption): void {
		const chosen = option.id ? found.choices.get(option.id) : undefined;
		if (chosen) onchange(chosen);
	}

	function setValues(values: string[]): void {
		if (values.length === 0) onchange(null);
	}
</script>

<ValueField
	hint={city ? m.valueForm.cityOnMap(city.name) : m.valueForm.cityHint}
	label={m.valueForm.city}
	onpick={pick}
	options={found.options}
	placeholder={m.valueForm.cityPlaceholder}
	single
	bind:query
	bind:values={() => (city ? [city.name] : []), setValues}
/>
