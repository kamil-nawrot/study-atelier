<script lang="ts">
	import { Button, Dialog, NoImage } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import CloseUpFigure from '#lib/exhibitions/components/CloseUpFigure/CloseUpFigure.svelte';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { CloseUpAttributes } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

	type Props = {
		open?: boolean;
		lookup: ArtworkLookup;
		artworkId: string;
		onpick: (attributes: CloseUpAttributes) => void;
	};

	let { open = $bindable(false), lookup, artworkId, onpick }: Props = $props();

	const zoomId = $props.id();

	let x = $state(0.5);
	let y = $state(0.5);
	let viewWidth = $state(0.3);

	const image = $derived(lookup.pictures(artworkId)?.[0] ?? null);
	const source = $derived(artworkImageSource(image, 1280));

	$effect(() => {
		if (!open) return;
		x = 0.5;
		y = 0.5;
		viewWidth = 0.3;
		void lookup.wantPictures(artworkId);
	});

	function point(event: MouseEvent): void {
		const rect =
			event.currentTarget instanceof HTMLElement
				? event.currentTarget.getBoundingClientRect()
				: undefined;
		if (!rect || rect.width === 0 || rect.height === 0) return;
		x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
	}

	function add(): void {
		onpick({ artworkId, imageId: image?.id ?? null, x, y, viewWidth });
		open = false;
	}
</script>

<Dialog title={m.exhibitions.closeUpDialog.title} bind:open>
	<div class="body">
		<p class="hint">{m.exhibitions.closeUpDialog.hint}</p>
		{#if source}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div class="stage" data-stage="" onclick={point}>
				<img alt="" draggable="false" src={source.src} />
				<span style:left="{x * 100}%" style:top="{y * 100}%" class="mark"></span>
			</div>
			<label class="zoom" for={zoomId}>
				<span>{m.exhibitions.closeUpDialog.zoom}</span>
				<input id={zoomId} max="0.6" min="0.1" step="0.05" type="range" bind:value={viewWidth} />
			</label>
			<div class="preview">
				<p class="hint">{m.exhibitions.closeUpDialog.preview}</p>
				<CloseUpFigure {artworkId} {lookup} {viewWidth} {x} {y} />
			</div>
		{:else}
			<div class="empty">
				<NoImage />
				<p>{m.exhibitions.closeUpDialog.noImage}</p>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={!source} onclick={add} variant="primary">
			{m.exhibitions.closeUpDialog.add}
		</Button>
	{/snippet}
</Dialog>

<style>
	.body {
		display: grid;
		gap: var(--spacing-4);
	}

	.hint {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.stage {
		position: relative;
		cursor: crosshair;
	}

	.stage img {
		display: block;
		width: 100%;
		max-height: 60vh;
		object-fit: contain;
	}

	.mark {
		position: absolute;
		width: var(--spacing-4);
		height: var(--spacing-4);
		border: var(--border-width-base) solid var(--color-fg);
		background: var(--color-surface);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.zoom {
		display: grid;
		gap: var(--spacing-1);
		font-size: var(--font-size-sm);
	}

	.preview {
		display: grid;
		gap: var(--spacing-2);
	}

	.empty {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
	}
</style>
