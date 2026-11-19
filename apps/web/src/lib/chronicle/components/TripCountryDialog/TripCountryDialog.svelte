<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { countryName } from '#lib/catalogue/countries/countries.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { TripCountryCheck } from '#lib/chronicle/trip-country-check/trip-country-check.svelte.ts';

	type Props = {
		check: TripCountryCheck;
	};

	let { check }: Props = $props();

	let texts = $derived(m.chronicle.tripCountryDialog);
</script>

<Dialog
	description={check.clash
		? texts.description(
				check.clash.place,
				countryName(check.clash.placeCountry),
				check.clash.trip,
				countryName(check.clash.tripCountry)
			)
		: ''}
	onclose={() => check.answer(false)}
	size="small"
	title={texts.title}
	bind:open={check.open}
>
	{#snippet footer()}
		<Button onclick={() => check.answer(false)}>
			{texts.back}
		</Button>
		<Button onclick={() => check.answer(true)} variant="primary">
			{texts.confirm}
		</Button>
	{/snippet}
</Dialog>
