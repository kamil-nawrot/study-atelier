<script lang="ts">
	import { Alert, Button, FormActions } from '@study-atelier/ui';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { albumEntryKey } from '#lib/albums/album-entry/album-entry.ts';
	import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
	import { saveArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import { AlbumMerge } from '#lib/compare/album-merge-state/album-merge-state.svelte.ts';
	import {
		ownFieldRows,
		wikidataOf,
		wikidataRow
	} from '#lib/compare/comparison-rows/comparison-rows.ts';
	import ComparisonPair from '#lib/compare/components/ComparisonPair/ComparisonPair.svelte';
	import MergeRows from '#lib/compare/components/MergeRows/MergeRows.svelte';
	import { imageRow } from '#lib/compare/merge-image-row/merge-image-row.ts';
	import { fixedRow, mergeRows } from '#lib/compare/merge-rows/merge-rows.ts';
	import { removedParts, takenParts } from '#lib/compare/merge-summary/merge-summary.ts';
	import type { MergeRow } from '#lib/compare/types/merge-row.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';

	type Props = {
		mine: ArtworkRecord;
		version: AlbumVersion;
		ownFields?: OwnFieldDefinition[];
		saveLabel?: string;
		actions?: Snippet;
		notice?: Snippet;
		onsaved?: () => void | Promise<void>;
	};

	let { mine, version, ownFields = [], saveLabel, actions, notice, onsaved }: Props = $props();

	const merge = new AlbumMerge(
		() => mine,
		() => version.artwork
	);

	let savedChanges = $state(JSON.stringify(merge.changes));
	let busy = $state(false);
	let error = $state('');

	const changes = new UnsavedChanges(
		() => JSON.stringify(merge.changes),
		() => savedChanges,
		(current, saved) => current !== saved
	);

	let entry = $derived(albumEntryKey(version));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: String(mine.number) }));
	let savable = $derived(
		merge.count > 0 ||
			(mine.album?.entry === entry ? mine.album.revision < version.revision : onsaved !== undefined)
	);
	let rows = $derived<MergeRow[]>([
		imageRow({
			mine,
			album: version.artwork,
			changes: merge.changes,
			toggleImage: (path) => merge.toggleImage(path),
			toggleOwnImage: (key) => merge.toggleOwnImage(key)
		}),
		...mergeRows({
			mine,
			album: version.artwork,
			newValues: version.newValues,
			changes: merge.changes,
			handlers: {
				pick: (field, fromAlbum) => merge.pickField(field, fromAlbum),
				toggleAdded: (field, name) => merge.toggleAdded(field, name),
				toggleDropped: (field, name) => merge.toggleDropped(field, name)
			}
		}),
		...[
			...ownFieldRows(mine, version.artwork, ownFields),
			wikidataRow(wikidataOf(mine), version.wikidataId)
		]
			.map(fixedRow)
			.filter((row) => row.kind !== 'same' || row.value.length > 0)
	]);
	let taken = $derived(takenParts(mine, version.artwork, merge.changes));
	let removed = $derived(removedParts(mine, merge.changes));

	async function save(): Promise<void> {
		busy = true;
		error = '';
		const result = await saveArtwork(
			{ ...merge.merged, relations: undefined, album: { entry, revision: version.revision } },
			{ id: mine.id, image: mine.image, images: mine.images }
		);
		busy = false;
		if (!result.saved) {
			error = result.error || (Object.values(result.fieldErrors)[0] ?? m.common.unexpectedError);
			return;
		}
		savedChanges = JSON.stringify(merge.changes);
		if (onsaved) {
			await onsaved();
			return;
		}
		await goto(artworkPath, { replace: true, refreshAll: true, state: { saved: result.number } });
	}
</script>

<ComparisonPair headings={[m.compare.mine, m.compare.album]} left={mine} right={version.artwork}>
	{#if notice}
		<div class="notice">{@render notice()}</div>
	{/if}
	<p class="hint">{m.compare.hint}</p>
	<MergeRows {rows} />
	{#if error}
		<Alert title={m.artworkForm.errorTitle} tone="danger">
			{error}
		</Alert>
	{/if}
	<FormActions>
		<p class="summary" aria-live="polite">
			{#if taken.length === 0 && removed.length === 0}
				{m.compare.unchanged}
			{:else}
				{#if taken.length > 0}
					<span>{m.compare.taken(taken.join(', '))}</span>
				{/if}
				{#if removed.length > 0}
					<span>{m.compare.removed(removed.join(', '))}</span>
				{/if}
			{/if}
		</p>
		{#if actions}
			{@render actions()}
		{:else}
			<Button href={artworkPath}>
				{m.common.cancel}
			</Button>
		{/if}
		<Button disabled={busy || !savable} onclick={save} variant="primary">
			{busy ? m.common.saving : (saveLabel ?? m.compare.saveChanges)}
		</Button>
	</FormActions>
</ComparisonPair>

<DiscardDialog {changes} description={m.common.discardDescription} />

<style>
	.notice {
		padding-top: var(--spacing-6);
	}

	.hint {
		margin: 0;
		padding-top: var(--spacing-6);
		color: var(--color-fg-muted);
	}

	.summary {
		display: grid;
		flex: 1 1 100%;
		align-self: center;
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	@media (min-width: 768px) {
		.summary {
			flex-basis: 16rem;
		}
	}
</style>
