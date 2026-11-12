<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import { onMount, tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Alert, Button, EmptyState, Icon, PageHeader, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import NewExhibitionDialog from '#lib/exhibitions/components/NewExhibitionDialog/NewExhibitionDialog.svelte';
	import ExhibitionList from '#lib/exhibitions/components/ExhibitionList/ExhibitionList.svelte';
	import { createExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	const images = new WallImages();
	const wide = new MediaQuery('min-width: 768px');

	let toast: Toast;
	let adding = $state(false);
	let naming = $state(false);
	let addError = $state<string>();
	let query = $state('');
	let covers = $derived(new Map(images.apply(data.covers).map((artwork) => [artwork.id, artwork])));

	export const snapshot: Snapshot<{ query: string; scroll: number }> = {
		capture: () => ({ query, scroll: window.scrollY }),
		restore: (value) => {
			query = value.query;
			void tick().then(() => window.scrollTo({ top: value.scroll, behavior: 'instant' }));
		}
	};

	$effect(() => {
		for (const cover of data.covers) images.request(cover);
	});

	onMount(() => {
		const message = page.state.exhibitionMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/exhibitions'), { state: {}, shallow: true, replace: true });
	});

	async function add(title: string): Promise<void> {
		if (adding) return;
		adding = true;
		addError = undefined;
		const { id, error } = await createExhibition(title);
		if (error || !id) {
			adding = false;
			addError = error;
			return;
		}
		await goto(`${resolve('/(app)/atelier/exhibitions/[id]', { id })}?edit` as ResolvedPathname);
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading title={m.exhibitions.title}>
	{#snippet bar()}
		{#if !data.error && wide.current}
			<div class="actions">
				<Button disabled={adding} onclick={() => (naming = true)} variant="primary">
					<Icon icon={Plus} size="sm" />
					{adding ? m.exhibitions.adding : m.exhibitions.add}
				</Button>
			</div>
		{/if}
	{/snippet}

	<PageHeader lead={m.exhibitions.lead}>
		{#snippet aside()}
			{#if !data.error && data.exhibitions.length > 0}
				<span class="caption">{m.exhibitions.count(data.exhibitions.length)}</span>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.error}
		<Alert title={m.exhibitions.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		{#if data.exhibitions.length === 0}
			<EmptyState icon={ScrollText} text={m.exhibitions.empty} title={m.exhibitions.emptyTitle} />
		{:else}
			<ExhibitionList
				{covers}
				exhibitions={data.exhibitions}
				onimagefailed={(artwork) => images.failed(artwork)}
				bind:query
			/>
		{/if}
	{/if}
</AtelierLayout>

<NewExhibitionDialog busy={adding} error={addError} oncreate={add} bind:open={naming} />

<Toast bind:this={toast} />

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}
</style>
