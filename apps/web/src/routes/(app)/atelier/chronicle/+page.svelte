<script lang="ts">
	import { onMount } from 'svelte';
	import { AddButton, Alert, PageHeader, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import VisitList from '#lib/chronicle/components/VisitList/VisitList.svelte';
	import { seenCount } from '#lib/chronicle/seen/seen.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const images = new WallImages();

	let toast: Toast;
	let artworks = $derived(
		new Map(images.apply(data.artworks).map((artwork) => [artwork.id, artwork]))
	);

	onMount(() => {
		const message = page.state.chronicleMessage;
		if (message === undefined) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/chronicle'), { state: {}, shallow: true, replace: true });
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading title={m.chronicle.title}>
	{#snippet bar()}
		{#if !data.error}
			<div class="actions">
				<AddButton href={resolve('/(app)/atelier/chronicle/new')} label={m.chronicle.add} />
			</div>
		{/if}
	{/snippet}

	<PageHeader lead={m.chronicle.lead}>
		{#snippet aside()}
			{#if !data.error && data.visits.length > 0}
				<span class="caption">
					{m.chronicle.count(
						data.visits.filter((visit) => visit.kind === 'visit').length,
						data.visits.filter((visit) => visit.kind === 'trip').length,
						seenCount(data.visits, artworks)
					)}
				</span>
			{/if}
		{/snippet}
	</PageHeader>

	{#if data.error}
		<Alert title={m.chronicle.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<VisitList
			{artworks}
			onimagefailed={(artwork) => images.failed(artwork)}
			onnearscreen={(artwork) => images.request(artwork)}
			visits={data.visits}
		/>
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
