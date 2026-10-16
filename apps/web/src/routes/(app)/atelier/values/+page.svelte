<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { onMount } from 'svelte';
	import { Alert, Icon, Tabs, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		CARD_INDEX_TABS,
		rememberCardIndexTab,
		rememberedCardIndexTab
	} from '#lib/collection/card-index-tab.ts';
	import { buildTimeline, valuesOf } from '#lib/collection/card-index.ts';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import CardIndexList from '#lib/collection/components/CardIndexList.svelte';
	import CardIndexTimeline from '#lib/collection/components/CardIndexTimeline.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');
	const tabs = CARD_INDEX_TABS.map((value) => ({ value, label: m.cardIndex.tabs[value] }));

	let toast: Toast;
	let tab = $state<string>(rememberedCardIndexTab());

	let timeline = $derived(buildTimeline(data.index));

	$effect(() => {
		rememberCardIndexTab(tab);
	});

	onMount(() => {
		const message = page.state.valueMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(cardIndexPath, { state: {}, shallow: true, replace: true });
	});
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

	{#if data.error}
		<Alert title={m.cardIndex.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<Tabs label={m.cardIndex.tabsLabel} {tabs} bind:value={tab}>
			{#if tab === 'timeline'}
				<CardIndexTimeline {timeline} />
			{:else if tab === 'material' || tab === 'author' || tab === 'location'}
				{#key tab}
					<CardIndexList
						empty={m.cardIndex.emptyList[tab]}
						records={valuesOf(data.index, tab)}
						searchLabel={m.cardIndex.search[tab]}
					/>
				{/key}
			{/if}
		</Tabs>
	{/if}
</AtelierLayout>

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
