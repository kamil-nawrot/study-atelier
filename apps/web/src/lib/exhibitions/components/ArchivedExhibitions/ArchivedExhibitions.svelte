<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Alert, Button, Dialog, EmptyState, MetaLine, NoImage } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import {
		deleteExhibition,
		restoreExhibition
	} from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import { archivedSince } from '#lib/exhibitions/exhibition-dates/exhibition-dates.ts';
	import type { ArchivedExhibition } from '#lib/exhibitions/exhibition-page-data/exhibition-page-data.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		exhibitions: readonly ArchivedExhibition[];
		covers: readonly WallArtwork[];
		onmessage: (message: string) => void;
	};

	let { exhibitions, covers, onmessage }: Props = $props();

	const images = new WallImages();

	let removed = $state<string[]>([]);
	let busy = $state<string>();
	let actionError = $state<string>();
	let deleteTarget = $state<ArchivedExhibition>();
	let deleteOpen = $state(false);
	let deleteError = $state<string>();

	let shown = $derived(exhibitions.filter((exhibition) => !removed.includes(exhibition.id)));
	let coverById = $derived(
		new Map(images.apply([...covers]).map((artwork) => [artwork.id, artwork]))
	);

	$effect(() => {
		for (const cover of covers) images.request(cover);
	});

	function nameOf(exhibition: ArchivedExhibition): string {
		return exhibition.title;
	}

	async function restore(exhibition: ArchivedExhibition): Promise<void> {
		if (busy) return;
		busy = exhibition.id;
		actionError = undefined;
		const { error } = await restoreExhibition(exhibition.id);
		busy = undefined;
		if (error) {
			actionError = error;
			return;
		}
		removed.push(exhibition.id);
		onmessage(m.trash.exhibitionRestored(nameOf(exhibition)));
	}

	function askToDelete(exhibition: ArchivedExhibition): void {
		deleteTarget = exhibition;
		deleteError = undefined;
		deleteOpen = true;
	}

	async function confirmDelete(): Promise<void> {
		const exhibition = deleteTarget;
		if (!exhibition || busy) return;
		busy = exhibition.id;
		deleteError = undefined;
		const { error } = await deleteExhibition(exhibition.id);
		busy = undefined;
		if (error) {
			deleteError = error;
			return;
		}
		deleteOpen = false;
		removed.push(exhibition.id);
		onmessage(m.trash.exhibitionDeleted(nameOf(exhibition)));
	}
</script>

{#if shown.length === 0}
	<EmptyState icon={Trash} text={m.trash.exhibitionsEmpty} title={m.trash.emptyTitle} />
{:else}
	{#if actionError}
		<Alert title={m.trash.actionErrorTitle} tone="danger">
			{actionError}
		</Alert>
	{/if}
	<ul>
		{#each shown as exhibition (exhibition.id)}
			{@const cover = exhibition.coverId ? coverById.get(exhibition.coverId) : undefined}
			<li>
				<div class="thumbnail">
					{#if cover?.image?.src}
						<img
							alt=""
							loading="lazy"
							onerror={() => images.failed(cover)}
							src={cover.image.src}
							srcset={cover.image.srcset}
						/>
					{:else}
						<NoImage />
					{/if}
				</div>
				<div class="text">
					<cite class="exhibition-title">{nameOf(exhibition)}</cite>
					<MetaLine
						class="meta"
						text={m.trash.exhibitionMeta(
							exhibition.artworkCount,
							archivedSince(exhibition.deletedAt)
						)}
					/>
				</div>
				<div class="actions">
					<Button
						aria-label={m.trash.restore}
						compact
						disabled={busy === exhibition.id}
						icon={RotateCcw}
						onclick={() => restore(exhibition)}
					>
						{m.trash.restore}
					</Button>
					<Button
						aria-label={m.trash.deleteForever}
						compact
						disabled={busy === exhibition.id}
						icon={Trash}
						onclick={() => askToDelete(exhibition)}
						variant="danger"
					>
						{m.trash.deleteForever}
					</Button>
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

<Dialog
	children={deleteError ? deleteErrorAlert : undefined}
	description={m.trash.exhibitionDeleteDescription}
	size="small"
	title={m.trash.exhibitionDeleteTitle(deleteTarget ? nameOf(deleteTarget) : '')}
	bind:open={deleteOpen}
>
	{#snippet footer()}
		<Button onclick={() => (deleteOpen = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={busy !== undefined} onclick={confirmDelete} variant="primary">
			{busy ? m.common.deleting : m.trash.deleteForever}
		</Button>
	{/snippet}
</Dialog>

<style>
	ul {
		margin: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--spacing-4);
		padding: var(--spacing-4) 0;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.thumbnail {
		width: var(--spacing-16);
		aspect-ratio: 4 / 5;
		padding: var(--spacing-1);
		background: var(--color-mat-bg);
	}

	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.exhibition-title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
	}

	.text > :global(.meta) {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		gap: var(--spacing-2);
	}
</style>
