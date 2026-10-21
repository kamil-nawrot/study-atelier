<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, Icon, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import ArtworkView from '#lib/collection/components/ArtworkView.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { favouriteLabel, favouriteToast, setFavourite } from '#lib/collection/favourite.ts';
	import { keyDirection } from '#lib/collection/flip.ts';
	import { formatRecordNumber, parseRecordNumber } from '#lib/collection/format.ts';
	import { moveToTrash } from '#lib/collection/trash.ts';
	import type { FlipDirection } from '#lib/collection/types.ts';
	import { neighboursIn, rememberedWallSequence } from '#lib/collection/wall-sequence.ts';
	import BackLink from '#lib/navigation/components/BackLink.svelte';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');
	const artworkRoute = '/(app)/atelier/[number]';
	const sequence = rememberedWallSequence();

	let toast: Toast;
	let trashOpen = $state(false);
	let moving = $state(false);
	let trashError = $state<string>();
	let favourites = $state<Record<string, boolean>>({});
	let favouriteError = $state<string>();

	let favourite = $derived(
		data.artwork ? (favourites[data.artwork.id] ?? data.artwork.favourite) : false
	);
	let number = $derived(parseRecordNumber(params.number));
	let label = $derived(number === null ? params.number : formatRecordNumber(number));
	let artworkPath = $derived(resolve('/(app)/atelier/[number]', { number: params.number }));
	let editPath = $derived(resolve('/(app)/atelier/[number]/edit', { number: params.number }));
	let neighbours = $derived(neighboursIn(sequence, number));
	let flipLinks = $derived(
		neighbours && {
			previous: artworkHref(neighbours.previous),
			next: artworkHref(neighbours.next)
		}
	);
	let wallPath = $derived<ResolvedPathname>(
		neighbours && sequence?.query
			? (`${atelierPath}?${sequence.query}` as ResolvedPathname)
			: atelierPath
	);
	let title = $derived(
		data.artwork
			? data.artwork.title
			: data.notFound
				? m.artworkForm.notFoundTitle(label)
				: m.artworkForm.loadErrorTitle
	);

	$effect(() => {
		if (flipLinks?.next) void preloadData(flipLinks.next);
	});

	function artworkHref(neighbour: number | null): ResolvedPathname | null {
		return neighbour === null ? null : resolve(artworkRoute, { number: String(neighbour) });
	}

	function flip(direction: FlipDirection): void {
		const neighbour = neighbours?.[direction];
		if (neighbour === null || neighbour === undefined || trashOpen) return;
		void goto(resolve(artworkRoute, { number: String(neighbour) }), {
			replace: true,
			reset: false
		});
	}

	function flipWithKey(event: KeyboardEvent): void {
		const direction = keyDirection(event);
		if (!direction || !neighbours) return;
		event.preventDefault();
		flip(direction);
	}

	onMount(() => {
		const saved = page.state.saved;
		if (saved === undefined) return;
		toast.show(m.artworkForm.changesSaved(formatRecordNumber(saved)));
		void goto(artworkPath, { state: {}, shallow: true, replace: true });
	});

	function askToTrash(): void {
		trashError = undefined;
		trashOpen = true;
	}

	async function trash(): Promise<void> {
		if (!data.artwork || moving) return;
		moving = true;
		trashError = undefined;
		const { error } = await moveToTrash(data.artwork.id);
		moving = false;
		if (error) {
			trashError = error;
			return;
		}
		trashOpen = false;
		await goto(atelierPath, { refreshAll: true, state: { trashed: data.artwork.number } });
	}

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

<svelte:window onkeydown={flipWithKey} />

<AtelierLayout email={data.session.user.email ?? ''} fill={data.artwork !== undefined} {title}>
	{#snippet bar()}
		<BackLink fallbackHref={wallPath} fallbackName={m.artworkView.back} />
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
			<Button aria-label={m.artworkView.edit} compact href={editPath} icon={Pencil}>
				{m.artworkView.edit}
			</Button>
			<Button
				aria-label={m.artworkView.delete}
				compact
				icon={Trash}
				onclick={askToTrash}
				variant="danger"
			>
				{m.artworkView.delete}
			</Button>
		{/if}
	{/snippet}

	{#if data.artwork}
		{#if favouriteError}
			<Alert tone="danger">
				{favouriteError}
			</Alert>
		{/if}
		<ArtworkView
			artwork={data.artwork}
			editHref={editPath}
			{flipLinks}
			glossary={data.glossary}
			mentions={data.mentions}
			noteLinks={data.noteLinks}
			onflip={flip}
			summaries={data.summaries}
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

{#snippet trashErrorAlert()}
	<Alert tone="danger">
		{trashError}
	</Alert>
{/snippet}

<Dialog
	children={trashError ? trashErrorAlert : undefined}
	description={m.trash.moveDescription}
	size="small"
	title={m.trash.moveTitle(label)}
	bind:open={trashOpen}
>
	{#snippet footer()}
		<Button onclick={() => (trashOpen = false)}>
			{m.trash.cancel}
		</Button>
		<Button disabled={moving} onclick={trash} variant="primary">
			{moving ? m.trash.moving : m.trash.move}
		</Button>
	{/snippet}
</Dialog>

<Toast bind:this={toast} />

<style>
	.heart {
		display: flex;
	}

	.heart.filled :global(svg) {
		fill: currentColor;
	}
</style>
