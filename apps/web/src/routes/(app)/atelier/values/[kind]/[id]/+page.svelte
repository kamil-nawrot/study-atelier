<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { onDestroy, onMount } from 'svelte';
	import { Alert, Button, Icon, Section, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { refreshExpiredImages, resolveImages } from '#lib/collection/artworks.ts';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import ValueView from '#lib/collection/components/ValueView.svelte';
	import { ImageQueue } from '#lib/collection/image-queue.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import {
		artworksOfValue,
		subjectId,
		subjectName,
		subjectPath,
		valueEditPath,
		valueParents
	} from '#lib/collection/value-pages.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const REFRESH_DELAY_MS = 100;
	const cardIndexPath = resolve('/(app)/atelier/values');

	let toast: Toast;
	let updated = $state<Record<string, WallArtwork>>({});
	let failedImages: WallArtwork[] = [];
	let refreshTimer: ReturnType<typeof setTimeout> | undefined;

	const imageQueue = new ImageQueue(resolveImages, (resolved) => {
		for (const artwork of resolved) updated[artwork.id] = artwork;
	});

	let subject = $derived(data.subject);
	let title = $derived(
		subject
			? subjectName(subject)
			: data.notFound
				? m.valuePage.notFoundTitle
				: m.valuePage.loadErrorTitle
	);
	let editHref = $derived(subject ? valueEditPath(subject.kind, subjectId(subject)) : undefined);
	let artworks = $derived(
		subject
			? artworksOfValue(data.artworks, subject).map((artwork) => updated[artwork.id] ?? artwork)
			: []
	);
	let parents = $derived(subject ? valueParents(data.index, subject) : []);

	$effect.pre(() => {
		void data.artworks;
		updated = {};
		imageQueue.reset();
	});

	onMount(() => {
		const message = page.state.valueMessage;
		if (message === undefined || !subject) return;
		toast.show(message);
		void goto(subjectPath(subject), { state: {}, shallow: true, replace: true });
	});

	onDestroy(() => {
		clearTimeout(refreshTimer);
		imageQueue.reset();
	});

	function imageFailed(artwork: WallArtwork): void {
		failedImages.push(artwork);
		clearTimeout(refreshTimer);
		refreshTimer = setTimeout(refreshImages, REFRESH_DELAY_MS);
	}

	async function refreshImages(): Promise<void> {
		const batch = failedImages;
		failedImages = [];
		for (const artwork of await refreshExpiredImages(batch)) updated[artwork.id] = artwork;
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} {title}>
	{#snippet bar()}
		<a class="back" href={cardIndexPath}>
			<Icon icon={ArrowLeft} />
			{m.valuePage.back}
		</a>
		{#if editHref}
			<Button aria-label={m.valuePage.edit} href={editHref}>
				<Icon icon={Pencil} size="sm" />
				<span class="label">
					{m.valuePage.edit}
				</span>
			</Button>
		{/if}
	{/snippet}

	{#if subject && editHref}
		<ValueView count={artworks.length} details={data.details} {editHref} {parents} {subject} />

		<section class="artworks" aria-labelledby="value-artworks">
			<header>
				<h2 id="value-artworks">{m.valuePage.kinds[subject.kind].artworks}</h2>
				<span class="count">{m.atelier.count(artworks.length)}</span>
			</header>
			{#if artworks.length === 0}
				<p class="empty">{m.valuePage.kinds[subject.kind].noArtworks}</p>
			{:else}
				<ArtworkWall
					{artworks}
					onimagefailed={imageFailed}
					onnearscreen={(artwork) => imageQueue.request(artwork)}
				/>
			{/if}
		</section>
	{:else}
		<Section>
			{#if data.notFound}
				<p class="lead">{data.error}</p>
			{:else}
				<Alert tone="danger">
					{data.error}
				</Alert>
			{/if}
		</Section>
		<div>
			<Button href={cardIndexPath}>
				{m.valuePage.back}
			</Button>
		</div>
	{/if}
</AtelierLayout>

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

	.artworks {
		display: grid;
		gap: var(--spacing-6);
		margin-top: var(--spacing-6);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.artworks header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	h2 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-lg);
	}

	.count,
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
