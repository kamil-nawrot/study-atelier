<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Icon, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
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
	flip.follow();

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
			<Button aria-label={m.common.edit} compact href={editPath} icon={Pencil}>
				{m.common.edit}
			</Button>
			<Button
				aria-label={m.common.delete}
				compact
				icon={Trash}
				onclick={() => (trashOpen = true)}
				variant="danger"
			>
				{m.common.delete}
			</Button>
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
