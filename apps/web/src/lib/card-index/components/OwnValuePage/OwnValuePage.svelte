<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button, LoadFailure, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import OwnValueDialog from '#lib/card-index/components/OwnValueDialog/OwnValueDialog.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import {
		ownFieldPath,
		ownValuePath,
		type OwnValuePageData
	} from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import type { OwnValue } from '#lib/card-index/types/own-value.ts';

	type Props = {
		email: string;
		data: OwnValuePageData;
	};

	let { email, data }: Props = $props();

	const cardIndexPath = resolve('/(app)/atelier/values');
	const images = new WallImages();

	let toast: Toast;
	let editOpen = $state(false);

	let field = $derived(data.field);
	let value = $derived(data.value);
	let artworks = $derived(images.apply(data.artworks));
	let title = $derived(
		value?.name ?? (data.notFound ? m.ownFields.page.notFoundTitle : m.valuePage.loadErrorTitle)
	);

	$effect.pre(() => {
		void data.artworks;
		images.reset();
	});

	async function saved(message: string, kept?: OwnValue): Promise<void> {
		if (kept && field) await goto(ownValuePath(field.id, kept.id), { replace: true });
		else await invalidateAll();
		toast.show(message);
	}
</script>

<AtelierLayout {email} {title}>
	{#snippet bar()}
		<BackLink
			fallbackHref={field ? ownFieldPath(field.id) : cardIndexPath}
			fallbackName={field?.name ?? m.valuePage.back}
		/>
		{#if value}
			<Button aria-label={m.common.edit} compact icon={Pencil} onclick={() => (editOpen = true)}>
				{m.common.edit}
			</Button>
		{/if}
	{/snippet}

	{#if field && value}
		<div class="page">
			<header>
				<p class="kind">
					{m.ownFields.summary([
						m.ownFields.page.valueKind(field.name),
						m.atelier.count(artworks.length)
					])}
				</p>
				<h1>{value.name}</h1>
			</header>

			<section class="artworks" aria-labelledby="value-artworks">
				<header>
					<h2 id="value-artworks">{m.ownFields.page.artworks}</h2>
					<span class="count">{m.atelier.count(artworks.length)}</span>
				</header>
				{#if artworks.length === 0}
					<p class="empty">{m.ownFields.page.noArtworks}</p>
				{:else}
					<ArtworkWall
						{artworks}
						onimagefailed={(artwork) => images.failed(artwork)}
						onnearscreen={(artwork) => images.request(artwork)}
					/>
				{/if}
			</section>
		</div>
	{:else}
		<LoadFailure
			backHref={cardIndexPath}
			backLabel={m.valuePage.back}
			message={data.error ?? ''}
			notFound={data.notFound === true}
		/>
	{/if}
</AtelierLayout>

<Toast bind:this={toast} />

{#if field && value}
	<OwnValueDialog {field} onsaved={saved} {value} bind:open={editOpen} />
{/if}

<style>
	.page {
		display: grid;
		gap: var(--spacing-8);
	}

	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.kind {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.artworks {
		display: grid;
		gap: var(--spacing-6);
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
</style>
