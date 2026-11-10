<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { AddButton, Alert, PageHeader, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import GlossaryList from '#lib/glossary/components/GlossaryList/GlossaryList.svelte';
	import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;
	let query = $state('');
	let chosen = $state<GlossaryCategory[]>([]);

	type Saved = { query: string; chosen: GlossaryCategory[]; scroll?: number };

	export const snapshot: Snapshot<Saved> = {
		capture: () => ({ query, chosen: [...chosen], scroll: window.scrollY }),
		restore: (value) => {
			query = value.query;
			chosen = value.chosen ?? [];
			const { scroll } = value;
			if (scroll === undefined) return;
			void tick().then(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
		}
	};

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
				<AddButton href={resolve('/(app)/atelier/glossary/new')} label={m.glossary.add} />
			</div>
		{/if}
	{/snippet}

	<PageHeader lead={m.glossary.lead}>
		{#snippet aside()}
			{#if !data.error && data.entries.length > 0}
				<span class="caption">{m.glossary.count(data.entries.length)}</span>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.error}
		<Alert title={m.glossary.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<GlossaryList entries={data.entries} bind:chosen bind:query />
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}
</style>
