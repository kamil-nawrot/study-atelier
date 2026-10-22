<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert, Tabs, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		CARD_INDEX_TABS,
		isCardIndexTab,
		rememberCardIndexTab,
		rememberedCardIndexTab
	} from '#lib/collection/card-index-tab.ts';
	import { buildTimeline, valuesOf } from '#lib/collection/card-index.ts';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import CardIndexList from '#lib/collection/components/CardIndexList.svelte';
	import CardIndexTimeline from '#lib/collection/components/CardIndexTimeline.svelte';
	import OwnFieldsTab from '#lib/collection/components/OwnFieldsTab.svelte';
	import { valuePath } from '#lib/collection/value-pages.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');
	const tabs = CARD_INDEX_TABS.map((value) => ({
		value,
		label: m.cardIndex.tabs[value],
		end: value === 'own'
	}));

	let toast: Toast;
	let tab = $state<string>(rememberedCardIndexTab());
	let query = $state('');

	export const snapshot: Snapshot<{ tab: string; query: string }> = {
		capture: () => ({ tab, query }),
		restore: (value) => {
			if (!isCardIndexTab(value.tab)) return;
			tab = value.tab;
			query = value.query;
		}
	};

	function chooseTab(next: string): void {
		if (next !== tab) query = '';
		tab = next;
	}

	let timeline = $derived(buildTimeline(data.index));

	async function ownFieldsChanged(message?: string): Promise<void> {
		await invalidateAll();
		if (message) toast.show(message);
	}

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
	<header>
		<h1>{m.cardIndex.title}</h1>
		<p class="lead">{m.cardIndex.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.cardIndex.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<Tabs label={m.cardIndex.tabsLabel} {tabs} bind:value={() => tab, chooseTab}>
			{#if tab === 'timeline'}
				<CardIndexTimeline {timeline} />
			{:else if tab === 'material' || tab === 'author' || tab === 'location'}
				{@const kind = tab}
				{#key kind}
					<CardIndexList
						empty={m.cardIndex.emptyList[kind]}
						href={(id) => valuePath(kind, id)}
						records={valuesOf(data.index, kind)}
						searchLabel={m.cardIndex.search[kind]}
						bind:query
					/>
				{/key}
			{:else if tab === 'own'}
				<OwnFieldsTab
					error={data.ownFieldsError}
					fields={data.ownFields}
					onchanged={ownFieldsChanged}
				/>
			{/if}
		</Tabs>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
