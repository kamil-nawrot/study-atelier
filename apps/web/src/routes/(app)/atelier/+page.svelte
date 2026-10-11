<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { Alert, Button, Icon, SearchField, Section } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { filterByTitle } from '#lib/collection/search.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');

	export const snapshot: Snapshot<string> = {
		capture: () => query,
		restore: (value) => (query = value)
	};

	const addPath = resolve('/(app)/atelier/new');

	let shown = $derived(filterByTitle(data.artworks, query));
	let total = $derived(data.artworks.length);
	let searching = $derived(query.trim() !== '');
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.atelier.title}>
	{#snippet bar()}
		<div class="search">
			<SearchField
				disabled={total === 0}
				label={m.atelier.search}
				placeholder={m.atelier.search}
				bind:value={query}
			/>
		</div>
		<Button aria-label={m.atelier.add} href={addPath} variant="primary">
			<Icon icon={Plus} />
			<span class="add-label">
				{m.atelier.add}
			</span>
		</Button>
	{/snippet}

	<header>
		<h1>{m.atelier.title}</h1>
		{#if total > 0}
			<span class="caption">
				{searching ? m.atelier.filteredCount(shown.length, total) : m.atelier.count(total)}
			</span>
		{/if}
	</header>

	{#if data.error}
		<Alert title={m.atelier.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else if total === 0}
		<div class="state">
			<Section>
				<h2>{m.atelier.emptyTitle}</h2>
				<p class="lead">{m.atelier.empty}</p>
				<div>
					<Button href={addPath}>
						<Icon icon={Plus} />
						{m.atelier.addFirst}
					</Button>
				</div>
			</Section>
		</div>
	{:else if shown.length === 0}
		<div class="state">
			<Section>
				<h2>{m.atelier.noResultsTitle}</h2>
				<p class="lead">{m.atelier.noResults(query.trim())}</p>
				<div>
					<Button onclick={() => (query = '')}>
						{m.atelier.clearSearch}
					</Button>
				</div>
			</Section>
		</div>
	{:else}
		<ArtworkWall artworks={shown} />
	{/if}
</AtelierLayout>

<style>
	.search {
		flex: 1;
		min-width: 0;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	.state {
		max-width: var(--size-content-default);
	}

	.add-label {
		display: none;
	}

	@media (min-width: 768px) {
		.add-label {
			display: inline;
		}
	}
</style>
