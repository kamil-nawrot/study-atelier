<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Star from '@lucide/svelte/icons/star';
	import { onDestroy } from 'svelte';
	import { ArtworkImage, Button, Icon, NoImage } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import type { ImageSearchQuery } from '#lib/images/types.ts';
	import { MAX_ARTWORK_IMAGES } from '../artwork-form.ts';
	import { artworkImageSource } from '../artwork-image.ts';
	import type { ArtworkImageInput, ImageFieldTexts } from '../types.ts';
	import ImageField from './ImageField.svelte';

	type Props = {
		alt: string;
		searchReady: boolean;
		query: ImageSearchQuery;
		texts: ImageFieldTexts;
		image: ArtworkImageInput | null;
		images: (ArtworkImageInput | null)[];
	};

	let {
		alt,
		searchReady,
		query,
		texts,
		image = $bindable(),
		images = $bindable()
	}: Props = $props();

	const SLOT_WIDTH = 120;

	let selected = $state(0);

	let slots = $derived([image, ...images]);
	let full = $derived(slots.length >= MAX_ARTWORK_IMAGES);

	$effect.pre(() => {
		if (selected > images.length) selected = images.length;
	});

	onDestroy(() => {
		for (const slot of [image, ...images]) {
			if (slot?.kind === 'file') URL.revokeObjectURL(slot.previewUrl);
		}
	});

	function current(): ArtworkImageInput | null {
		return selected === 0 ? image : (images[selected - 1] ?? null);
	}

	function setCurrent(next: ArtworkImageInput | null): void {
		if (selected === 0) {
			if (next === null && images.length > 0) {
				const [first, ...rest] = images;
				image = first;
				images = rest;
				return;
			}
			image = next;
			return;
		}
		if (next === null) {
			images = images.filter((_, index) => index !== selected - 1);
			selected = Math.min(selected, images.length);
			return;
		}
		images = images.map((slot, index) => (index === selected - 1 ? next : slot));
	}

	function addSlot(): void {
		images = [...images, null];
		selected = images.length;
	}

	function makeMain(): void {
		const chosen = images[selected - 1];
		images = images.map((slot, index) => (index === selected - 1 ? image : slot));
		image = chosen;
		selected = 0;
	}
</script>

{#snippet slotRow()}
	<div class="slots">
		{#each slots as slot, index (index)}
			{@const preview = artworkImageSource(slot, SLOT_WIDTH)}
			<button
				class="slot"
				class:selected={index === selected}
				aria-label={m.artworkForm.imageSlot(index + 1, slots.length)}
				aria-pressed={index === selected}
				onclick={() => (selected = index)}
				type="button"
			>
				<span class="thumb" aria-hidden="true">
					{#if preview}
						<ArtworkImage
							alt=""
							height={preview.height}
							sizes="{SLOT_WIDTH}px"
							src={preview.src}
							srcset={preview.srcset}
							width={preview.width}
						/>
					{:else}
						<NoImage />
					{/if}
				</span>
				{#if index === 0}
					<span class="main">{m.artworkForm.mainImage}</span>
				{/if}
			</button>
		{/each}
		{#if !full}
			<button
				class="slot add"
				aria-label={m.artworkForm.addImage}
				onclick={addSlot}
				title={m.artworkForm.addImage}
				type="button"
			>
				<Icon icon={Plus} />
			</button>
		{/if}
	</div>
	{#if full}
		<p class="caption">{m.artworkForm.imagesLimit}</p>
	{/if}
{/snippet}

{#snippet mainAction()}
	{#if selected > 0 && current() !== null}
		<Button onclick={makeMain}>
			<Icon icon={Star} size="sm" />
			{m.artworkForm.setMainImage}
		</Button>
	{/if}
{/snippet}

<ImageField
	actions={mainAction}
	{alt}
	{query}
	removable={selected > 0}
	{searchReady}
	slots={slotRow}
	{texts}
	bind:image={current, setCurrent}
/>

<style>
	.slots {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.slot {
		position: relative;
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		padding: 0;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-fg);
		cursor: pointer;
	}

	.slot.selected {
		outline: var(--border-width-button) solid var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.thumb {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.thumb :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.main {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-align: center;
	}

	.add {
		border-style: dashed;
	}
</style>
