<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Alert, Button, Dialog, Section, Toast } from '@study-atelier/ui';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import DuplicateDialog from '#lib/collection/components/DuplicateDialog.svelte';
	import { DuplicateCheck } from '#lib/collection/duplicate-check.svelte.ts';
	import { formatDeletedOn, formatRecordNumber } from '#lib/collection/format.ts';
	import { deletePermanently, restoreArtwork } from '#lib/collection/trash.ts';
	import type { TrashArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { REVIEW_COUNTS_DEPENDENCY } from '#lib/review/review-data.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let toast: Toast;
	const duplicateCheck = new DuplicateCheck();
	let removed = $state<string[]>([]);
	let busy = $state<string>();
	let actionError = $state<string>();
	let deleteOpen = $state(false);
	let deleteTarget = $state<TrashArtwork>();
	let deleteError = $state<string>();

	let shown = $derived(data.artworks.filter((artwork) => !removed.includes(artwork.id)));
	let deleteLabel = $derived(deleteTarget ? formatRecordNumber(deleteTarget.number) : '');

	function byline(artwork: TrashArtwork): string {
		return [artwork.authors.join(', '), artwork.date].filter(Boolean).join(' · ');
	}

	async function restore(artwork: TrashArtwork): Promise<void> {
		if (busy) return;
		busy = artwork.id;
		actionError = undefined;
		if (!(await duplicateCheck.confirm(artwork, artwork.id))) {
			busy = undefined;
			return;
		}
		const { error } = await restoreArtwork(artwork.id);
		busy = undefined;
		if (error) {
			actionError = error;
			return;
		}
		removed.push(artwork.id);
		void invalidate(REVIEW_COUNTS_DEPENDENCY);
		toast.show(m.trash.restored(formatRecordNumber(artwork.number)));
	}

	function askToDelete(artwork: TrashArtwork): void {
		deleteTarget = artwork;
		deleteError = undefined;
		deleteOpen = true;
	}

	async function confirmDelete(): Promise<void> {
		const artwork = deleteTarget;
		if (!artwork || busy) return;
		busy = artwork.id;
		deleteError = undefined;
		const { error } = await deletePermanently(artwork.id);
		busy = undefined;
		if (error) {
			deleteError = error;
			return;
		}
		deleteOpen = false;
		removed.push(artwork.id);
		toast.show(m.trash.deleted(formatRecordNumber(artwork.number)));
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.trash.title}>
	<header>
		<h1>{m.trash.title}</h1>
		{#if shown.length > 0}
			<span class="caption">{m.atelier.count(shown.length)}</span>
		{/if}
	</header>

	{#if data.error}
		<Alert title={m.trash.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else if shown.length === 0}
		<div class="state">
			<Section>
				<h2>{m.trash.emptyTitle}</h2>
				<div>
					<Button href={resolve('/(app)/atelier')}>
						{m.trash.back}
					</Button>
				</div>
			</Section>
		</div>
	{:else}
		{#if actionError}
			<Alert title={m.trash.actionErrorTitle} tone="danger">
				{actionError}
			</Alert>
		{/if}
		<ul>
			{#each shown as artwork (artwork.id)}
				<li>
					<div class="thumbnail">
						{#if artwork.image}
							<img
								alt=""
								loading="lazy"
								sizes="64px"
								src={artwork.image.src}
								srcset={artwork.image.srcset}
							/>
						{:else}
							<span class="window"></span>
						{/if}
					</div>
					<div class="text">
						<cite class="artwork-title">{artwork.title}</cite>
						{#if byline(artwork)}
							<span class="byline">{byline(artwork)}</span>
						{/if}
						<span class="meta">
							{formatRecordNumber(artwork.number)} · {formatDeletedOn(artwork.deletedAt)}
						</span>
					</div>
					<div class="actions">
						<Button
							aria-label={m.trash.restore}
							compact
							disabled={busy === artwork.id}
							icon={RotateCcw}
							onclick={() => restore(artwork)}
						>
							{m.trash.restore}
						</Button>
						<Button
							aria-label={m.trash.deleteForever}
							compact
							disabled={busy === artwork.id}
							icon={Trash}
							onclick={() => askToDelete(artwork)}
							variant="danger"
						>
							{m.trash.deleteForever}
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</AtelierLayout>

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

<Dialog
	children={deleteError ? deleteErrorAlert : undefined}
	description={m.trash.deleteDescription(deleteLabel)}
	size="small"
	title={m.trash.deleteTitle(deleteLabel)}
	bind:open={deleteOpen}
>
	{#snippet footer()}
		<Button onclick={() => (deleteOpen = false)}>
			{m.trash.cancel}
		</Button>
		<Button disabled={busy !== undefined} onclick={confirmDelete} variant="primary">
			{busy ? m.trash.deleting : m.trash.deleteForever}
		</Button>
	{/snippet}
</Dialog>

<DuplicateDialog action="restore" check={duplicateCheck} />

<Toast bind:this={toast} />

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	.state {
		max-width: var(--size-content-default);
	}

	ul {
		margin: 0;
		padding: 0;
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

	.thumbnail img,
	.window {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.window {
		background: var(--color-mat-window);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.artwork-title {
		font-size: var(--font-size-lg);
	}

	.byline {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.meta {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		gap: var(--spacing-2);
	}
</style>
