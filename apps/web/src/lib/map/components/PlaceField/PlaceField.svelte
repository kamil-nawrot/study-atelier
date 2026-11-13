<script lang="ts">
	import { untrack } from 'svelte';
	import { Alert, TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import PlaceSuggestions from '#lib/map/components/PlaceSuggestions/PlaceSuggestions.svelte';
	import WorldMap from '#lib/map/components/WorldMap/WorldMap.svelte';
	import { loadGeography } from '#lib/map/geography/geography.ts';
	import type { Geography } from '#lib/map/types/geography.ts';
	import type { PlaceChoice } from '#lib/map/types/place-choice.ts';
	import type { PlacePoint } from '#lib/map/types/place-point.ts';

	type Props = {
		name: string;
		point: PlacePoint | null;
		wikidataId?: string | null;
	};

	let { name, point = $bindable(), wikidataId = $bindable(null) }: Props = $props();

	let geography = $state<Geography>();
	let failed = $state(false);
	let focus = $state<PlacePoint | null>(null);
	const searched = untrack(() => name.trim());

	let choice = $derived<PlaceChoice | null>(point ? { point, wikidataId } : null);
	let fit = $derived(focus ? [focus] : point ? [point] : []);

	$effect(() => {
		if (geography || failed) return;
		loadGeography().then(
			(loaded) => (geography = loaded),
			() => (failed = true)
		);
	});

	function choose(next: PlaceChoice): void {
		point = next.point;
		wikidataId = next.wikidataId;
		if (next.wikidataId) focus = next.point;
	}

	function pick(picked: PlacePoint): void {
		point = picked;
		wikidataId = null;
	}

	function remove(): void {
		point = null;
		wikidataId = null;
	}
</script>

<section class="field" aria-labelledby="position-field-title">
	<h2 id="position-field-title" class="overline">{m.map.position.title}</h2>
	<div class="split">
		<div class="stage">
			{#if failed}
				<Alert tone="danger">
					{m.map.loadError}
				</Alert>
			{:else if geography}
				<WorldMap {fit} {geography} marker={point} onpick={pick} wholeWorld />
			{/if}
		</div>
		<div class="side">
			<PlaceSuggestions name={searched} {choice} onchoose={choose} />
			{#if point}
				<div>
					<TextButton onclick={remove}>
						{m.map.position.remove}
					</TextButton>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.field,
	.side {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
	}

	.split {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6);
	}

	.stage {
		display: flex;
		flex-direction: column;
		height: 360px;
		min-width: 0;
	}

	@media (min-width: 768px) {
		.split {
			flex-direction: row;
			gap: var(--spacing-8);
		}

		.stage {
			flex: 1;
			height: 440px;
		}

		.side {
			width: 320px;
			flex: none;
		}
	}
</style>
