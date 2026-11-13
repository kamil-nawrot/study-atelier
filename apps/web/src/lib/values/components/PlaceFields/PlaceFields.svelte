<script lang="ts">
	import { ChoiceTiles, FieldMessage, SearchSelect } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { countryOptions } from '#lib/catalogue/countries/countries.ts';
	import { isPlaceType, placeTiles } from '#lib/catalogue/place-types/place-types.ts';
	import CityField from '#lib/values/components/CityField/CityField.svelte';
	import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
	import type { LocationDetails } from '#lib/values/types/location-details.ts';
	import type { PlaceCity } from '#lib/values/types/place-city.ts';

	type Props = {
		location: LocationDetails;
		cities: readonly CardIndexRecord[];
		typeError?: string;
	};

	let { location = $bindable(), cities, typeError }: Props = $props();

	const countries = countryOptions();
	const placeOptions = placeTiles();
	const typeMessageId = $props.id();

	function chooseType(value: string | null): void {
		location.placeType = isPlaceType(value) ? value : null;
		if (location.placeType === 'city') location.city = null;
	}

	function chooseCity(city: PlaceCity | null): void {
		location.city = city;
		if (!city) return;
		location.point = null;
		location.countryCode = city.countryCode ?? null;
	}
</script>

<div class="type">
	<ChoiceTiles
		clearable
		label={m.valueForm.placeType}
		onchange={chooseType}
		options={placeOptions}
		value={location.placeType}
	/>
	{#if typeError}
		<FieldMessage id={typeMessageId} error={typeError} live />
	{/if}
</div>
{#if location.placeType !== 'city'}
	<CityField {cities} city={location.city ?? null} onchange={chooseCity} />
{/if}
{#if !location.city}
	<SearchSelect
		hint={m.valueForm.countryHint}
		label={m.valueForm.country}
		options={countries}
		placeholder={m.valueForm.countryPlaceholder}
		bind:value={location.countryCode}
	/>
{/if}

<style>
	.type {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
