<script lang="ts">
	import MoreActions from '#lib/shared/navigation/MoreActions/MoreActions.svelte';
	import Columns2 from '@lucide/svelte/icons/columns-2';
	import Heart from '@lucide/svelte/icons/heart';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Icon, LoadFailure, Toast, Tooltip } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { preloadArtwork } from '#lib/artworks/artwork-preload/artwork-preload.ts';
	import { compareHref } from '#lib/compare/compare-address/compare-address.ts';
	import { followLongLook, watchLongLook } from '#lib/career/long-look/long-look.ts';
	import ArtworkTrashDialog from '#lib/artworks/components/ArtworkTrashDialog/ArtworkTrashDialog.svelte';
	import ArtworkView from '#lib/artworks/components/ArtworkView/ArtworkView.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import { favouriteLabel, favouriteToast } from '#lib/wall/favourite/favourite.ts';
	import { setFavourite } from '#lib/wall/favourite-data/favourite-data.ts';
	import { ArtworkFlip } from '#lib/wall/artwork-flip/artwork-flip.svelte.ts';
	import {
		formatRecordNumber,
		parseRecordNumber
	} from '#lib/catalogue/record-number/record-number.ts';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');

	let toast: Toast;
	let trashOpen = $state(false);
	let favourites = $state<Record<string, boolean>>({});
	let favouriteError = $state<string>();

	let favourite = $derived(
		data.artwork ? (favourites[data.artwork.id] ?? data.artwork.favourite) : false
	);
	let number = $derived(parseRecordNumber(params.number));
	let label = $derived(number === null ? params.number : formatRecordNumber(number));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: params.number }));
	let editPath = $derived(resolve('/(app)/atelier/[number]/edit', { number: params.number }));
	let comparePath = $derived(compareHref({ left: number, right: null }));
	let canCompare = $derived(data.atelierCount === undefined || data.atelierCount >= 2);
	let title = $derived(
		data.artwork
			? data.artwork.title
			: data.notFound
				? m.artworkForm.notFoundTitle(label)
				: m.artworkForm.loadErrorTitle
	);

	const flip = new ArtworkFlip(
		() => number,
		() => trashOpen
	);
	flip.follow(preloadArtwork);

	$effect(() => followLongLook(page.data.session?.user.id, page.data.longLookRecorded === true));
	$effect(() => {
		if (data.artwork?.id) return watchLongLook(page.data.careerShown !== false);
	});

	onMount(() => {
		const saved = page.state.saved;
		if (saved === undefined) return;
		toast.show(m.artworkForm.changesSaved(formatRecordNumber(saved)));
		void goto(artworkPath, { state: {}, shallow: true, replace: true });
	});

	async function toggleFavourite(): Promise<void> {
		if (!data.artwork) return;
		const { id } = data.artwork;
		const next = !favourite;
		favouriteError = undefined;
		favourites[id] = next;
		const { error } = await setFavourite(id, next);
		if (error) {
			favourites[id] = !next;
			favouriteError = error;
			return;
		}
		toast.show(favouriteToast(next));
	}
</script>

<svelte:window onkeydown={(event) => flip.flipWithKey(event)} />

{#snippet editButton()}
	<Button aria-label={m.common.edit} compact href={editPath} icon={Pencil}>
		{m.common.edit}
	</Button>
{/snippet}

<AtelierLayout email={data.session.user.email ?? ''} fill={data.artwork !== undefined} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={flip.wallPath} fallbackName={m.artworkView.back} />
		{#if data.artwork}
			<Button
				aria-label={favouriteLabel(favourite)}
				aria-pressed={favourite}
				onclick={toggleFavourite}
			>
				<span class="heart" class:filled={favourite}>
					<Icon icon={Heart} size="sm" />
				</span>
			</Button>
			<MoreActions
				actions={[
					canCompare
						? { label: m.compare.label, icon: Columns2, href: comparePath }
						: { label: m.compare.label, icon: Columns2, reason: m.compare.unavailable },
					{ label: m.common.delete, icon: Trash, onclick: () => (trashOpen = true), danger: true }
				]}
			>
				{#snippet kept()}
					{@render editButton()}
				{/snippet}
				{#if canCompare}
					<Button aria-label={m.compare.label} compact href={comparePath} icon={Columns2}>
						{m.compare.label}
					</Button>
				{:else}
					<Tooltip align="end" placement="bottom" text={m.compare.unavailable}>
						{#snippet children(describedby)}
							<Button
								aria-describedby={describedby}
								aria-disabled="true"
								aria-label={m.compare.label}
								compact
								icon={Columns2}
							>
								{m.compare.label}
							</Button>
						{/snippet}
					</Tooltip>
				{/if}
				{@render editButton()}
				<Button
					aria-label={m.common.delete}
					compact
					icon={Trash}
					onclick={() => (trashOpen = true)}
					variant="danger"
				>
					{m.common.delete}
				</Button>
			</MoreActions>
		{/if}
	{/snippet}

	{#if data.artwork}
		{#if favouriteError}
			<Alert tone="danger">
				{favouriteError}
			</Alert>
		{/if}
		{#if data.pinsError}
			<Alert tone="danger">
				{m.pins.loadFailed}
			</Alert>
		{/if}
		<ArtworkView
			artwork={data.artwork}
			editHref={editPath}
			exhibitionCovers={data.exhibitionCovers}
			exhibitions={data.exhibitions}
			flipLinks={flip.links}
			focusPin={page.url.searchParams.get('pin') ?? undefined}
			glossary={data.glossary}
			loupeOnOpen={data.preferences?.viewLoupeOn}
			mentions={data.mentions}
			noteLinks={data.noteLinks}
			onflip={(direction) => flip.flip(direction)}
			ownFields={data.ownFields}
			pins={data.pins}
			showPinsOnOpen={data.preferences?.viewShowPins}
			summaries={data.summaries}
			visits={data.visits}
		/>
	{:else}
		<LoadFailure
			backHref={atelierPath}
			backLabel={m.artworkForm.back}
			heading={title}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<ArtworkTrashDialog artwork={data.artwork} {label} bind:open={trashOpen} />

<Toast bind:this={toast} />

<style>
	.heart {
		display: flex;
	}

	.heart.filled :global(svg) {
		fill: currentColor;
	}
</style>
