<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Alert, Button, IconButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import PlaceSuggestions from '#lib/map/components/PlaceSuggestions/PlaceSuggestions.svelte';
	import type { PlaceChoice } from '#lib/map/types/place-choice.ts';
	import type { PlaceToFill } from '#lib/map/types/place-to-fill.ts';

	type Props = {
		current: PlaceToFill | undefined;
		left: number;
		choice: PlaceChoice | null;
		saving: boolean;
		error?: string;
		onchoose: (choice: PlaceChoice) => void;
		onsave: () => void;
		onskip: () => void;
		onclose: () => void;
	};

	let { current, left, choice, saving, error, onchoose, onsave, onskip, onclose }: Props = $props();
</script>

<section class="panel" aria-labelledby="fill-title">
	<header>
		<div class="heading">
			<p id="fill-title" class="overline">{m.map.fill.title}</p>
			{#if current}
				<h2>{current.place.name}</h2>
				<p class="caption">{m.map.city.artworks(current.count)} · {m.map.fill.left(left)}</p>
			{/if}
		</div>
		<IconButton
			icon={X}
			label={m.map.fill.close}
			onclick={onclose}
			tooltipAlign="end"
			tooltipPlacement="bottom"
			variant="plain"
		/>
	</header>
	{#if current}
		{#key current.place.id}
			<p>{m.map.fill.lead(current.place.name)}</p>
			<PlaceSuggestions name={current.place.name} {choice} {onchoose} />
		{/key}
		{#if error}
			<Alert tone="danger">
				{error}
			</Alert>
		{/if}
		<div class="actions">
			<Button disabled={!choice || saving} onclick={onsave} variant="primary">
				{saving ? m.common.saving : m.map.fill.save}
			</Button>
			<Button disabled={saving} onclick={onskip}>
				{m.map.fill.skip}
			</Button>
		</div>
	{:else}
		<p>{m.map.fill.done}</p>
	{/if}
</section>

<style>
	.panel {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
	}

	header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	.heading {
		display: grid;
		gap: var(--spacing-1);
	}

	h2 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}
</style>
