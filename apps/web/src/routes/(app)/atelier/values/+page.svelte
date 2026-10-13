<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Icon, Tabs, Toast } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { loadCardIndex } from '#lib/collection/card-index-data.ts';
	import { buildTimeline, findRecord, valuesOf } from '#lib/collection/card-index.ts';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import CardIndexList from '#lib/collection/components/CardIndexList.svelte';
	import CardIndexTimeline from '#lib/collection/components/CardIndexTimeline.svelte';
	import ValueDialog from '#lib/collection/components/ValueDialog.svelte';
	import type { CardIndexData } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tabs = (['timeline', 'material', 'author', 'location'] as const).map((value) => ({
		value,
		label: m.cardIndex.tabs[value]
	}));

	let toast: Toast;
	let tab = $state<string>('timeline');
	let refreshed = $state<CardIndexData>();
	let refreshError = $state<string>();
	let selectedId = $state<string>();

	let index = $derived(refreshed ?? data.index);
	let error = $derived(refreshError ?? data.error);
	let selected = $derived(selectedId ? findRecord(index, selectedId) : undefined);
	let timeline = $derived(buildTimeline(index));

	async function changed(message: string): Promise<void> {
		selectedId = undefined;
		const result = await loadCardIndex();
		if (result.error) {
			refreshError = result.error;
			return;
		}
		refreshError = undefined;
		refreshed = result.index;
		toast.show(message);
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.cardIndex.title}>
	{#snippet bar()}
		<a class="back" href={resolve('/(app)/atelier')}>
			<Icon icon={ArrowLeft} />
			{m.artworkView.back}
		</a>
	{/snippet}

	<header>
		<h1>{m.cardIndex.title}</h1>
		<p class="lead">{m.cardIndex.lead}</p>
	</header>

	{#if error}
		<Alert title={m.cardIndex.loadErrorTitle} tone="danger">
			{error}
		</Alert>
	{:else}
		<Tabs label={m.cardIndex.tabsLabel} {tabs} bind:value={tab}>
			{#if tab === 'timeline'}
				<CardIndexTimeline onopen={(id) => (selectedId = id)} {timeline} />
			{:else if tab === 'material' || tab === 'author' || tab === 'location'}
				<CardIndexList
					empty={m.cardIndex.emptyList[tab]}
					onopen={(id) => (selectedId = id)}
					records={valuesOf(index, tab)}
				/>
			{/if}
		</Tabs>
	{/if}
</AtelierLayout>

{#if selected}
	{#key selected.id}
		<ValueDialog
			{index}
			onchanged={changed}
			onclose={() => (selectedId = undefined)}
			record={selected}
		/>
	{/key}
{/if}

<Toast bind:this={toast} />

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
