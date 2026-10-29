<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import GlossaryView from '#lib/glossary/components/GlossaryView/GlossaryView.svelte';
	import { deleteGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const glossaryPath = resolve('/(app)/atelier/glossary');

	let toast: Toast;
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string>();

	const images = new WallImages();

	let entry = $derived(data.entry);
	let pinned = $derived(data.pinned ?? []);
	let pinIds = $derived(new Map(pinned.map((item) => [item.artwork.id, item.pinId])));
	let artworks = $derived(images.apply(pinned.map((item) => item.artwork)));

	$effect.pre(() => {
		void data.pinned;
		images.reset();
	});

	let title = $derived(
		entry
			? entry.name
			: data.notFound
				? m.glossary.view.notFoundTitle
				: m.glossary.view.loadErrorTitle
	);

	function pinnedHref(artwork: WallArtwork): string {
		const path = resolve('/(app)/atelier/[number]', { number: String(artwork.number) });
		const pinId = pinIds.get(artwork.id);
		return pinId ? `${path}?pin=${encodeURIComponent(pinId)}` : path;
	}

	onMount(() => {
		const message = page.state.glossaryMessage;
		if (message === undefined || !entry) return;
		toast.show(message);
		void goto(resolve('/(app)/atelier/glossary/[id]', { id: entry.id }), {
			state: {},
			shallow: true,
			replace: true
		});
	});

	function askToDelete(): void {
		deleteError = undefined;
		deleteOpen = true;
	}

	async function remove(): Promise<void> {
		if (!entry || deleting) return;
		deleting = true;
		deleteError = undefined;
		const result = await deleteGlossaryEntry(entry.id);
		deleting = false;
		if (result.error) {
			deleteError = result.error;
			return;
		}
		deleteOpen = false;
		await goto(glossaryPath, {
			refreshAll: true,
			state: { glossaryMessage: m.glossary.view.deleted(entry.name) }
		});
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={glossaryPath} fallbackName={m.glossary.back} />
		{#if entry}
			<Button
				aria-label={m.common.edit}
				compact
				href={resolve('/(app)/atelier/glossary/[id]/edit', { id: entry.id })}
				icon={Pencil}
			>
				{m.common.edit}
			</Button>
			<Button
				aria-label={m.common.delete}
				compact
				icon={Trash}
				onclick={askToDelete}
				variant="danger"
			>
				{m.common.delete}
			</Button>
		{/if}
	{/snippet}

	{#if entry}
		<GlossaryView entries={data.glossary} {entry} mentions={data.mentions} />
		{#if data.pinnedError}
			<Alert tone="danger">{m.pins.loadFailed}</Alert>
		{/if}
		{#if artworks.length > 0}
			<section class="artworks" aria-labelledby="glossary-artworks">
				<h2 id="glossary-artworks">{m.glossary.view.onArtworks}</h2>
				<ArtworkWall
					{artworks}
					hrefOf={pinnedHref}
					onimagefailed={(artwork) => images.failed(artwork)}
					onnearscreen={(artwork) => images.request(artwork)}
				/>
			</section>
		{/if}
	{:else}
		<LoadFailure
			backHref={glossaryPath}
			backLabel={m.glossary.back}
			errorTitle={m.glossary.view.loadErrorTitle}
			message={data.notFound ? m.glossary.view.notFound : (data.error ?? '')}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

{#if entry}
	<Dialog
		children={deleteError ? deleteErrorAlert : undefined}
		description={m.glossary.deleteConfirm.description}
		size="small"
		title={m.glossary.deleteConfirm.title(entry.name)}
		bind:open={deleteOpen}
	>
		{#snippet footer()}
			<Button onclick={() => (deleteOpen = false)}>
				{m.common.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.common.deleting : m.common.delete}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<style>
	.artworks {
		display: grid;
		gap: var(--spacing-6);
		margin-top: var(--spacing-8);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
