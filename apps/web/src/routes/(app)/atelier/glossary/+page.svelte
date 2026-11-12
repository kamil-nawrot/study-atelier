<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { AddButton, Alert, PageHeader, Tabs, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import GlossaryList from '#lib/glossary/components/GlossaryList/GlossaryList.svelte';
	import {
		GLOSSARY_TABS,
		isGlossaryTab,
		rememberGlossaryTab,
		rememberedGlossaryTab
	} from '#lib/glossary/glossary-tab/glossary-tab.ts';
	import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
	import SymbolAtlas from '#lib/symbols/components/SymbolAtlas/SymbolAtlas.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');
	const tabs = GLOSSARY_TABS.map((value) => ({ value, label: m.glossary.tabs[value] }));

	let toast: Toast;
	let tab = $state<string>(rememberedGlossaryTab());
	let query = $state('');
	let symbolQuery = $state('');
	let chosen = $state<GlossaryCategory[]>([]);
	let symbols = $derived(tab === 'symbols');
	let atlas = $derived(data.symbols ?? []);

	type Saved = {
		tab?: string;
		query: string;
		symbolQuery?: string;
		chosen: GlossaryCategory[];
		scroll?: number;
	};

	export const snapshot: Snapshot<Saved> = {
		capture: () => ({ tab, query, symbolQuery, chosen: [...chosen], scroll: window.scrollY }),
		restore: (value) => {
			if (isGlossaryTab(value.tab)) tab = value.tab;
			query = value.query;
			symbolQuery = value.symbolQuery ?? '';
			chosen = value.chosen ?? [];
			const { scroll } = value;
			if (scroll === undefined) return;
			void tick().then(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
		}
	};

	$effect(() => {
		rememberGlossaryTab(tab);
	});

	onMount(() => {
		const message = page.state.glossaryMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(glossaryPath, { state: {}, shallow: true, replace: true });
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading title={m.glossary.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				{#if symbols}
					<AddButton href={resolve('/(app)/atelier/glossary/symbols/new')} label={m.symbols.add} />
				{:else}
					<AddButton href={resolve('/(app)/atelier/glossary/new')} label={m.glossary.add} />
				{/if}
			</div>
		{/if}
	{/snippet}

	<PageHeader lead={m.glossary.lead}>
		{#snippet aside()}
			{#if symbols && atlas.length > 0}
				<span class="caption">{m.symbols.count(atlas.length)}</span>
			{:else if !symbols && !data.error && data.entries.length > 0}
				<span class="caption">{m.glossary.count(data.entries.length)}</span>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.error}
		<Alert title={m.glossary.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<Tabs label={m.glossary.tabsLabel} {tabs} bind:value={tab}>
			<div class="tab">
				{#if symbols}
					<SymbolAtlas error={data.symbolsError} symbols={atlas} bind:query={symbolQuery} />
				{:else}
					<GlossaryList entries={data.entries} bind:chosen bind:query />
				{/if}
			</div>
		</Tabs>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}

	.tab {
		padding-top: var(--spacing-4);
	}
</style>
