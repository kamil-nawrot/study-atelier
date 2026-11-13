<script lang="ts">
	import { untrack } from 'svelte';
	import { Alert, Button, TextButton } from '@study-atelier/ui';
	import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import PlaceSuggestions from '#lib/map/components/PlaceSuggestions/PlaceSuggestions.svelte';
	import WorldMap from '#lib/map/components/WorldMap/WorldMap.svelte';
	import { loadGeography } from '#lib/map/geography/geography.ts';
	import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
	import { nearestTown } from '#lib/map/towns/towns.ts';
	import type { Geography } from '#lib/map/types/geography.ts';
	import type { PlaceChoice } from '#lib/map/types/place-choice.ts';
	import type { PlacePoint } from '#lib/map/types/place-point.ts';

	type Props = {
		placeId: string;
		name: string;
		point: PlacePoint | null;
	};

	let { placeId, name, point: initial }: Props = $props();

	let point = $state(untrack(() => initial));
	let geography = $state<Geography>();
	let failed = $state(false);
	let editing = $state(false);
	let choice = $state<PlaceChoice | null>(null);
	let focus = $state<PlacePoint | null>(null);
	let saving = $state(false);
	let error = $state<string>();

	let town = $derived(point && geography ? nearestTown(point, geography.towns) : null);
	let townLine = $derived(
		town
			? [town.name, isCountryCode(town.countryCode) ? countryName(town.countryCode) : null]
					.filter(Boolean)
					.join(', ')
			: ''
	);
	let fit = $derived(focus ? [focus] : point ? [point] : []);

	$effect(() => {
		if (!(point || editing) || geography || failed) return;
		loadGeography().then(
			(loaded) => (geography = loaded),
			() => (failed = true)
		);
	});

	function start(): void {
		editing = true;
		choice = null;
		focus = null;
		error = undefined;
	}

	function choose(next: PlaceChoice): void {
		choice = next;
		if (next.wikidataId) focus = next.point;
	}

	async function save(next: PlaceChoice | null): Promise<void> {
		if (saving) return;
		saving = true;
		error = undefined;
		const result = await setPlacePoint(placeId, next?.point ?? null, next?.wikidataId ?? null);
		saving = false;
		if (result.error) {
			error = result.error;
			return;
		}
		point = next?.point ?? null;
		editing = false;
		focus = null;
	}
</script>

<section class="position" aria-labelledby="position-title">
	<h2 id="position-title" class="overline">{m.map.position.title}</h2>
	{#if editing}
		<PlaceSuggestions {name} {choice} onchoose={choose} />
	{:else if !point}
		<p class="empty">{m.map.position.empty}</p>
	{/if}
	{#if failed && (editing || point)}
		<Alert tone="danger">
			{m.map.loadError}
		</Alert>
	{:else if geography && (editing || point)}
		<WorldMap
			{fit}
			{geography}
			marker={choice?.point ?? point}
			onpick={editing ? (picked) => (choice = { point: picked, wikidataId: null }) : undefined}
			small
		/>
		{#if townLine && !editing}
			<p class="caption">{townLine}</p>
		{/if}
	{/if}
	{#if error}
		<Alert tone="danger">
			{error}
		</Alert>
	{/if}
	<div class="actions">
		{#if editing}
			<Button disabled={!choice || saving} onclick={() => void save(choice)} variant="primary">
				{saving ? m.common.saving : m.common.save}
			</Button>
			<Button disabled={saving} onclick={() => (editing = false)}>
				{m.common.cancel}
			</Button>
		{:else if point}
			<Button onclick={start}>
				{m.map.position.change}
			</Button>
			<TextButton disabled={saving} onclick={() => void save(null)}>
				{m.map.position.remove}
			</TextButton>
		{:else}
			<Button onclick={start}>
				{m.map.position.set}
			</Button>
		{/if}
	</div>
</section>

<style>
	.position {
		display: grid;
		gap: var(--spacing-3);
	}

	.empty,
	.caption {
		color: var(--color-fg-muted);
	}

	.caption {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2) var(--spacing-4);
	}
</style>
