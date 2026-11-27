<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Alert, Button, FormActions, Icon, TextButton } from '@study-atelier/ui';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { albumEntryKey } from '#lib/albums/album-entry/album-entry.ts';
	import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
	import { saveArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import { albumImages, imageAttachable } from '#lib/compare/album-merge/album-merge.ts';
	import { AlbumMerge } from '#lib/compare/album-merge-state/album-merge-state.svelte.ts';
	import {
		ownFieldRows,
		wikidataOf,
		wikidataRow
	} from '#lib/compare/comparison-rows/comparison-rows.ts';
	import ComparisonPair from '#lib/compare/components/ComparisonPair/ComparisonPair.svelte';
	import ComparisonRows from '#lib/compare/components/ComparisonRows/ComparisonRows.svelte';
	import { mergeRows } from '#lib/compare/merge-rows/merge-rows.ts';
	import type { DisplayRow } from '#lib/compare/types/display-row.ts';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import { albumCredit } from '#lib/images/credit/credit.ts';
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

	const THUMB_WIDTH = 160;

	const merge = new AlbumMerge(
		() => mine,
		() => version.artwork
	);

	let savedCount = $state(0);
	let busy = $state(false);
	let error = $state('');

	const changes = new UnsavedChanges(
		() => merge.count,
		() => savedCount,
		(current, saved) => current !== saved
	);

	let entry = $derived(albumEntryKey(version));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: String(mine.number) }));
	let savable = $derived(
		merge.count > 0 ||
			(mine.album?.entry === entry ? mine.album.revision < version.revision : onsaved !== undefined)
	);
	let rows = $derived<DisplayRow[]>([
		{ key: 'images', label: m.artworkForm.image, left: mineImages, right: theirImages },
		...mergeRows({
			mine,
			album: version.artwork,
			merged: merge.merged,
			newValues: version.newValues,
			changes: merge.changes,
			ontoggle: (field) => merge.toggleField(field)
		}),
		...ownFieldRows(mine, version.artwork, ownFields),
		wikidataRow(wikidataOf(mine), version.wikidataId)
	]);

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
		savedCount = merge.count;
		if (onsaved) {
			await onsaved();
			return;
		}
		await goto(artworkPath, { replace: true, refreshAll: true, state: { saved: result.number } });
	}
</script>

{#snippet thumb(image: ArtworkImageInput)}
	{@const source = artworkImageSource(image, THUMB_WIDTH)}
	<span class="thumb">
		{#if source}
			<img alt="" height={source.height} src={source.src} width={source.width} />
		{/if}
	</span>
{/snippet}

{#snippet mineImages()}
	<span class="thumbs">
		{#each [merge.merged.image, ...merge.merged.images] as image, index (index)}
			{#if image}
				{@render thumb(image)}
			{/if}
		{/each}
	</span>
{/snippet}

{#snippet theirImages()}
	<span class="thumbs">
		{#each albumImages(version.artwork) as image (image.kind === 'album' ? image.path : image)}
			{#if image.kind === 'album'}
				{@const attached = merge.images.includes(image.path)}
				<span class="album-image">
					{@render thumb(image)}
					<span class="credit">{albumCredit(image.licence, image.attribution)}</span>
					{#if imageAttachable(mine, merge.changes, image.path)}
						<TextButton inline onclick={() => merge.toggleImage(image.path)}>
							{#if !attached}
								<Icon icon={ArrowLeft} size="sm" />
							{/if}
							{attached ? m.compare.withdraw : m.compare.attachImage}
						</TextButton>
					{/if}
				</span>
			{/if}
		{/each}
	</span>
{/snippet}

<ComparisonPair headings={[m.compare.mine, m.compare.album]} left={mine} right={version.artwork}>
	{#if notice}
		<div class="notice">{@render notice()}</div>
	{/if}
	<ComparisonRows {rows} />
	{#if error}
		<Alert title={m.artworkForm.errorTitle} tone="danger">
			{error}
		</Alert>
	{/if}
	<FormActions>
		<p class="count">{m.compare.changes(merge.count)}</p>
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

	.thumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		gap: var(--spacing-3);
	}

	.album-image {
		display: grid;
		justify-items: start;
		gap: var(--spacing-1);
	}

	.album-image :global(.text-button) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		white-space: normal;
		text-align: start;
	}

	.thumb img {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 96px;
	}

	.credit {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.count {
		align-self: center;
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
