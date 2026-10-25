<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import VisitDeleteDialog from '#lib/chronicle/components/VisitDeleteDialog/VisitDeleteDialog.svelte';
	import VisitView from '#lib/chronicle/components/VisitView/VisitView.svelte';
	import { seenArtworks } from '#lib/chronicle/seen/seen.ts';
	import { visitDateFrom } from '#lib/chronicle/visit-date/visit-date.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const chroniclePath = resolve('/(app)/atelier/chronicle');
	const images = new WallImages();

	let toast: Toast;
	let deleteOpen = $state(false);
	let visit = $derived(data.visit);
	let byId = $derived(new Map(images.apply(data.artworks).map((artwork) => [artwork.id, artwork])));
	let artworks = $derived(visit ? seenArtworks(visit, byId) : []);
	let title = $derived(
		visit?.place ??
			(data.notFound ? m.chronicle.view.notFoundTitle : m.chronicle.view.loadErrorTitle)
	);

	onMount(() => {
		const message = page.state.chronicleMessage;
		if (message === undefined || !visit) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/chronicle/[id]', { id: visit.id }), {
			state: {},
			shallow: true,
			replace: true
		});
	});

	async function showDeleted(removed: Visit): Promise<void> {
		await goto(chroniclePath, {
			refreshAll: true,
			state: { chronicleMessage: m.chronicle.view.deleted(visitDateFrom(removed.date)) }
		});
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={chroniclePath} fallbackName={m.chronicle.back} />
		{#if visit}
			<Button
				aria-label={m.chronicle.view.edit}
				compact
				href={resolve('/(app)/atelier/chronicle/[id]/edit', { id: visit.id })}
				icon={Pencil}
			>
				{m.chronicle.view.edit}
			</Button>
			<Button
				aria-label={m.chronicle.view.delete}
				compact
				icon={Trash}
				onclick={() => (deleteOpen = true)}
				variant="danger"
			>
				{m.chronicle.view.delete}
			</Button>
		{/if}
	{/snippet}

	{#if visit}
		{#if data.artworksError}
			<Alert tone="danger">{data.artworksError}</Alert>
		{/if}
		<VisitView
			{artworks}
			glossary={data.glossary}
			noteLinks={data.noteLinks}
			onimagefailed={(artwork) => images.failed(artwork)}
			onnearscreen={(artwork) => images.request(artwork)}
			{visit}
		/>
	{:else}
		<LoadFailure
			backHref={chroniclePath}
			backLabel={m.chronicle.back}
			errorTitle={m.chronicle.view.loadErrorTitle}
			message={data.notFound ? m.chronicle.errors.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#if visit}
	<VisitDeleteDialog ondeleted={showDeleted} {visit} bind:open={deleteOpen} />
{/if}
