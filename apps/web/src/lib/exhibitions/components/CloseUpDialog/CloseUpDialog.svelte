<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import PinView from '#lib/pins/components/PinView/PinView.svelte';
	import { loadArtworkPins } from '#lib/pins/pin-data/pin-data.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { CloseUpAttributes } from '#lib/exhibitions/editor/new-block/new-block.ts';
	import type { Pin } from '#lib/pins/types/pin.ts';

	type Props = {
		open?: boolean;
		lookup: ArtworkLookup;
		artworkId: string;
		onpick: (attributes: CloseUpAttributes) => void;
	};

	const PIN_VIEW_WIDTH = 0.25;

	let { open = $bindable(false), lookup, artworkId, onpick }: Props = $props();

	let pins = $state<Pin[]>();
	let error = $state(false);

	const artwork = $derived(lookup.get(artworkId));
	const pictures = $derived(lookup.pictures(artworkId));
	const choices = $derived(
		(pins ?? []).flatMap((pin) => {
			const image = pictures?.find((picture) => picture.id === pin.imageId);
			return image ? [{ pin, image }] : [];
		})
	);

	$effect(() => {
		if (!open) return;
		const number = artwork?.number;
		pins = undefined;
		error = false;
		void lookup.wantPictures(artworkId);
		if (number === undefined) return;
		void loadArtworkPins(number).then((result) => {
			if (result.error) error = true;
			else pins = result.pins;
		});
	});

	function pick(pin: Pin): void {
		onpick({
			artworkId,
			imageId: pin.imageId,
			x: pin.x,
			y: pin.y,
			viewWidth: pin.viewWidth ?? PIN_VIEW_WIDTH
		});
		open = false;
	}
</script>

<Dialog size="wide" title={m.exhibitions.closeUpDialog.title} bind:open>
	<div class="body">
		{#if error}
			<p class="hint">{m.exhibitions.closeUpDialog.loadError}</p>
		{:else if pins === undefined || pictures === undefined}
			<p class="hint">{m.exhibitions.closeUpDialog.loading}</p>
		{:else if choices.length === 0}
			<p>{m.exhibitions.closeUpDialog.noPins}</p>
			{#if artwork}
				<a
					href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
					rel="external noopener"
					target="_blank">{m.exhibitions.closeUpDialog.openArtwork}</a
				>
			{/if}
		{:else}
			<p class="hint">{m.exhibitions.closeUpDialog.hint}</p>
			<ul class="pins">
				{#each choices as { pin, image }, index (pin.id)}
					<li>
						<button
							class="pin"
							aria-label={pin.text || m.exhibitions.closeUpDialog.pin(index + 1)}
							onclick={() => pick(pin)}
							type="button"
						>
							<PinView {image} viewWidth={pin.viewWidth ?? PIN_VIEW_WIDTH} x={pin.x} y={pin.y} />
							{#if pin.text}
								<span aria-hidden="true">{pin.text}</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
	{/snippet}
</Dialog>

<style>
	.body {
		display: grid;
		gap: var(--spacing-4);
	}

	p {
		margin: 0;
	}

	.hint {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	.pins {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(calc(6 * var(--spacing-6)), 1fr));
		gap: var(--spacing-8) var(--spacing-12);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pin {
		display: grid;
		gap: var(--spacing-2);
		width: 100%;
		align-content: start;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		text-align: center;
		cursor: pointer;
	}

	.pin:hover {
		filter: brightness(1.15);
	}

	.pin:hover span {
		text-decoration: underline;
	}

	.pin:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}
</style>
