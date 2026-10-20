<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import Plus from '@lucide/svelte/icons/plus';
	import Star from '@lucide/svelte/icons/star';
	import { onDestroy } from 'svelte';
	import { ArtworkImage, Icon, Tooltip } from '@study-atelier/ui';
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
						<span class="empty">
							<Icon icon={ImageIcon} size="sm" />
						</span>
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
		{#if selected > 0 && current() !== null}
			<Tooltip align="end" text={m.artworkForm.setMainImage}>
				{#snippet children(id)}
					<button
						class="make-main"
						aria-describedby={id}
						aria-label={m.artworkForm.setMainImage}
						onclick={makeMain}
						type="button"
					>
						<Icon icon={Star} size="sm" />
					</button>
				{/snippet}
			</Tooltip>
		{/if}
	</div>
	{#if full}
		<p class="caption">{m.artworkForm.imagesLimit}</p>
	{/if}
{/snippet}

<ImageField
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
		align-items: center;
		gap: var(--spacing-2);
	}

	.slots > :global(:last-child:not(.slot)) {
		margin-left: auto;
	}

	.slot {
		position: relative;
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		padding: 0;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-fg-muted);
		background: var(--color-surface);
		color: var(--color-fg);
		cursor: pointer;
		opacity: 0.6;
	}

	.slot.selected,
	.slot.add {
		opacity: 1;
	}

	.slot.selected {
		border-color: var(--color-fg);
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

	.empty {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: var(--color-fg-muted);
	}

	.add {
		border-style: dashed;
		background: transparent;
		color: var(--color-fg-muted);
	}

	.make-main {
		display: grid;
		place-items: center;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.make-main:hover,
	.make-main:focus-visible {
		color: var(--color-fg);
	}
</style>
