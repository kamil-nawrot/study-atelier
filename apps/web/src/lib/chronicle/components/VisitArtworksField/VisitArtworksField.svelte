<script lang="ts">
	import { SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		placeArtworks,
		placeOf,
		searchArtworks,
		toggled,
		withExtra
	} from '#lib/chronicle/visit-form/visit-form.ts';
	import VisitArtworkTick from '#lib/chronicle/components/VisitArtworkTick/VisitArtworkTick.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

	type Props = {
		form: VisitFormState;
		artworks: WallArtwork[];
		isNew: boolean;
		onnearscreen?: (artwork: WallArtwork) => void;
	};

	let { form = $bindable(), artworks, isNew, onnearscreen }: Props = $props();

	const fieldId = $props.id();

	let query = $state('');

	let place = $derived(placeOf(form));
	let byId = $derived(new Map(artworks.map((artwork) => [artwork.id, artwork])));
	let atPlace = $derived(placeArtworks(artworks, place));
	let extra = $derived(form.extra.flatMap((id) => byId.get(id) ?? []));
	let shown = $derived(new Set([...atPlace, ...extra].map((artwork) => artwork.id)));
	let results = $derived(searchArtworks(artworks, query, shown));

	function toggle(artwork: WallArtwork): void {
		form = toggled(form, artwork.id);
	}

	function add(artwork: WallArtwork): void {
		form = withExtra(form, artwork.id);
		query = '';
	}
</script>

<fieldset class="field">
	<legend>{m.chronicle.form.artworks}</legend>

	<div class="search">
		<SearchField
			label={m.chronicle.form.search}
			placeholder={m.chronicle.form.search}
			bind:value={query}
		/>
		{#if query.trim() !== ''}
			{#if results.length > 0}
				<ul class="results">
					{#each results as artwork (artwork.id)}
						<li>
							<button
								class="result"
								aria-label={m.chronicle.form.addArtwork(artwork.title)}
								onclick={() => add(artwork)}
								type="button"
							>
								<cite class="artwork-title">{artwork.title}</cite>
								<span class="caption">
									{[artwork.authors.join(', '), artwork.date].filter(Boolean).join(' · ')}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="caption">{m.chronicle.form.noMatch}</p>
			{/if}
		{/if}
	</div>

	{#if place === ''}
		<p class="caption">{m.chronicle.form.noPlace}</p>
	{:else if atPlace.length === 0}
		<p class="caption">{m.chronicle.form.placeEmpty}</p>
	{:else}
		<div class="group" aria-labelledby="{fieldId}-place" role="group">
			<p id="{fieldId}-place" class="group-title">{m.chronicle.form.fromPlace}</p>
			{#if isNew}
				<p class="caption">{m.chronicle.form.ticked}</p>
			{/if}
			<div class="grid">
				{#each atPlace as artwork (artwork.id)}
					<VisitArtworkTick
						{artwork}
						checked={form.chosen.includes(artwork.id)}
						{onnearscreen}
						ontoggle={toggle}
					/>
				{/each}
			</div>
		</div>
	{/if}

	{#if extra.length > 0}
		<div class="group" aria-labelledby="{fieldId}-extra" role="group">
			<p id="{fieldId}-extra" class="group-title">{m.chronicle.form.fromElsewhere}</p>
			<div class="grid">
				{#each extra as artwork (artwork.id)}
					<VisitArtworkTick
						{artwork}
						checked={form.chosen.includes(artwork.id)}
						{onnearscreen}
						ontoggle={toggle}
					/>
				{/each}
			</div>
		</div>
	{/if}
</fieldset>

<style>
	.field {
		display: grid;
		gap: var(--spacing-4);
		min-width: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.search,
	.group {
		display: grid;
		gap: var(--spacing-2);
	}

	.results {
		display: grid;
		padding: 0;
		border: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	.result {
		display: grid;
		width: 100%;
		padding: var(--spacing-2) var(--spacing-3);
		border: 0;
		background: transparent;
		color: var(--color-fg);
		text-align: start;
		cursor: pointer;
	}

	.result:hover,
	.result:focus-visible {
		background: var(--color-surface);
	}

	.group {
		gap: var(--spacing-3);
	}

	.group-title {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: var(--spacing-4);
	}
</style>
