<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Alert, Button, Dialog, Icon, Section, Toast } from '@study-atelier/ui';
	import { afterNavigate, goto, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import ArtworkView from '#lib/collection/components/ArtworkView.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { keyDirection } from '#lib/collection/flip.ts';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { formatRecordNumber, parseRecordNumber } from '#lib/collection/format.ts';
	import { moveToTrash } from '#lib/collection/trash.ts';
	import type { FlipDirection } from '#lib/collection/types.ts';
	import { neighboursIn, rememberedWallSequence } from '#lib/collection/wall-sequence.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');
	const artworkRoute = '/(app)/atelier/[number]';
	const sequence = rememberedWallSequence();

	let toast: Toast;
	let cameFromWall = false;
	let trashOpen = $state(false);
	let moving = $state(false);
	let trashError = $state<string>();

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

	afterNavigate(({ from }) => {
		if (from?.route.id === artworkRoute) return;
		cameFromWall = from?.route.id === '/(app)/atelier';
	});

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

	function goBack(event: MouseEvent): void {
		goBackThroughHistory(event, cameFromWall);
	}
</script>

<svelte:window onkeydown={flipWithKey} />

<AtelierLayout email={data.session.user.email ?? ''} fill={data.artwork !== undefined} {title}>
	{#snippet bar()}
		<a class="back" href={wallPath} onclick={goBack}>
			<Icon icon={ArrowLeft} />
			{m.artworkView.back}
		</a>
		{#if data.artwork}
			<Button aria-label={m.artworkView.edit} href={editPath}>
				<Icon icon={Pencil} size="sm" />
				<span class="label">
					{m.artworkView.edit}
				</span>
			</Button>
			<Button aria-label={m.artworkView.delete} onclick={askToTrash} variant="danger">
				<Icon icon={Trash} size="sm" />
				<span class="label">
					{m.artworkView.delete}
				</span>
			</Button>
		{/if}
	{/snippet}

	{#if data.artwork}
		<ArtworkView
			artwork={data.artwork}
			editHref={editPath}
			{flipLinks}
			mentions={data.mentions}
			noteLinks={data.noteLinks}
			onflip={flip}
			summaries={data.summaries}
		/>
	{:else}
		<Section>
			<h1>{title}</h1>
			{#if data.notFound}
				<p class="lead">{data.error}</p>
			{:else}
				<Alert tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={atelierPath}>
				{m.artworkForm.back}
			</Button>
		</div>
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
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.label {
		display: none;
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
