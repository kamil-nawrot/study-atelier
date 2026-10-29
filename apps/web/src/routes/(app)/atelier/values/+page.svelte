<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Alert, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		isCardIndexTab,
		rememberCardIndexTab,
		rememberedCardIndexTab
	} from '#lib/card-index/card-index-tab/card-index-tab.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import CardIndexTabs from '#lib/card-index/components/CardIndexTabs/CardIndexTabs.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');

	let toast: Toast;
	let tab = $state<string>(rememberedCardIndexTab());
	let query = $state('');

	type Saved = { tab: string; query: string; scroll?: number };

	export const snapshot: Snapshot<Saved> = {
		capture: () => ({ tab, query, scroll: window.scrollY }),
		restore: (value) => {
			if (!isCardIndexTab(value.tab)) return;
			tab = value.tab;
			query = value.query;
			const { scroll } = value;
			if (scroll === undefined) return;
			void tick().then(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
		}
	};

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
		<CardIndexTabs
			events={data.events}
			index={data.index}
			onmessage={(message) => toast.show(message)}
			ownFields={data.ownFields}
			ownFieldsError={data.ownFieldsError}
			bind:tab
			bind:query
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	header {
		display: grid;
		gap: var(--spacing-2);
	}
</style>
