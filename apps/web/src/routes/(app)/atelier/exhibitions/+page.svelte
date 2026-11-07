<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import { onMount } from 'svelte';
	import { Alert, Button, EmptyState, Icon, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import ExhibitionList from '#lib/exhibitions/components/ExhibitionList/ExhibitionList.svelte';
	import { createExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const images = new WallImages();

	let toast: Toast;
	let adding = $state(false);
	let addError = $state<string>();
	let covers = $derived(new Map(images.apply(data.covers).map((artwork) => [artwork.id, artwork])));

	$effect(() => {
		for (const cover of data.covers) images.request(cover);
	});

	onMount(() => {
		const message = page.state.exhibitionMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/exhibitions'), { state: {}, shallow: true, replace: true });
	});

	async function add(): Promise<void> {
		if (adding) return;
		adding = true;
		addError = undefined;
		const { id, error } = await createExhibition();
		if (error || !id) {
			adding = false;
			addError = error;
			return;
		}
		await goto(`${resolve('/(app)/atelier/exhibitions/[id]', { id })}?edit` as ResolvedPathname);
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.exhibitions.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				<Button disabled={adding} onclick={add} variant="primary">
					<Icon icon={Plus} size="sm" />
					<span class="long">{adding ? m.exhibitions.adding : m.exhibitions.add}</span>
					<span class="short">{m.common.add}</span>
				</Button>
			</div>
		{/if}
	{/snippet}

	<header>
		<div class="title">
			<h1>{m.exhibitions.title}</h1>
			{#if !data.error && data.exhibitions.length > 0}
				<span class="caption">{m.exhibitions.count(data.exhibitions.length)}</span>
			{/if}
		</div>
		<p class="lead">{m.exhibitions.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.exhibitions.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		{#if addError}
			<Alert title={m.exhibitions.addErrorTitle} tone="danger">
				{addError}
			</Alert>
		{/if}
		{#if data.exhibitions.length === 0}
			<EmptyState icon={ScrollText} text={m.exhibitions.empty} title={m.exhibitions.emptyTitle} />
		{:else}
			<ExhibitionList
				{covers}
				exhibitions={data.exhibitions}
				onimagefailed={(artwork) => images.failed(artwork)}
			/>
		{/if}
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
