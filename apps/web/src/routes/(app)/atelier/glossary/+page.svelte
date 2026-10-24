<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { onMount, tick } from 'svelte';
	import { Alert, Button, Icon, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import GlossaryList from '#lib/glossary/components/GlossaryList.svelte';
	import type { GlossaryCategory } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
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

<AtelierLayout email={data.session.user.email ?? ''} title={m.glossary.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				<Button href={resolve('/(app)/atelier/glossary/new')} variant="primary">
					<Icon icon={Plus} size="sm" />
					<span class="long">{m.glossary.add}</span>
					<span class="short">{m.glossary.addShort}</span>
				</Button>
			</div>
		{/if}
	{/snippet}

	<header>
		<div class="title">
			<h1>{m.glossary.title}</h1>
			{#if !data.error && data.entries.length > 0}
				<span class="caption">{m.glossary.count(data.entries.length)}</span>
			{/if}
		</div>
		<p class="lead">{m.glossary.lead}</p>
	</header>

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

	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
