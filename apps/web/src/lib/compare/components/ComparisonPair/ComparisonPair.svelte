<script lang="ts">
	import Blend from '@lucide/svelte/icons/blend';
	import Search from '@lucide/svelte/icons/search';
	import { StageButton, overlayScrollbar } from '@study-atelier/ui';
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import ComparisonStage from '#lib/compare/components/ComparisonStage/ComparisonStage.svelte';
	import { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
	import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
	import { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Side = 'left' | 'right';

	type Props = {
		left: ComparedSide;
		right: ComparedSide;
		headings?: [string, string];
		onchange?: (side: Side) => void;
		children: Snippet;
	};

	let { left, right, headings, onchange, children }: Props = $props();

	const mouse = new MediaQuery('(hover: hover) and (pointer: fine)');
	const loupe = new SharedLoupe();
	const palettes = { left: new PaletteLoader(), right: new PaletteLoader() };

	let paletteOn = $state(false);
	let leftReady = $state(false);
	let rightReady = $state(false);
	let loupeReady = $derived(leftReady || rightReady);
	let statuses = $derived(
		[
			left.image ? palettes.left.status : undefined,
			right.image ? palettes.right.status : undefined
		].filter((status) => status !== undefined)
	);
	let paletteOffered = $derived(statuses.length > 0);
	let paletteUnreadable = $derived(
		paletteOffered && statuses.every((status) => status === 'unreadable')
	);

	$effect(() => {
		if (!paletteOn) return;
		void palettes.left.load(left.image);
		void palettes.right.load(right.image);
	});
</script>

<div class="pair" {@attach overlayScrollbar()}>
	<div class="corner">
		{#if mouse.current}
			<StageButton
				active={loupe.on}
				aria-disabled={!loupeReady}
				aria-pressed={loupeReady ? loupe.on : undefined}
				data-loupe-toggle
				icon={Search}
				label={m.loupe.label}
				onclick={() => loupe.toggle(loupeReady)}
				tooltip={loupeReady ? m.compare.loupeBoth : m.loupe.unavailable}
				unavailable={!loupeReady}
			/>
		{/if}
		{#if paletteOffered}
			<StageButton
				active={paletteOn}
				aria-disabled={paletteUnreadable}
				aria-pressed={paletteUnreadable ? undefined : paletteOn}
				icon={Blend}
				label={m.palette.label}
				onclick={() => {
					if (!paletteUnreadable) paletteOn = !paletteOn;
				}}
				tooltip={paletteUnreadable
					? m.palette.unreadable
					: paletteOn
						? m.palette.hide
						: m.palette.label}
				unavailable={paletteUnreadable}
			/>
		{/if}
	</div>

	<div class="stages">
		<ComparisonStage
			artwork={left}
			changeable={onchange !== undefined}
			heading={headings?.[0]}
			{loupe}
			onchange={() => onchange?.('left')}
			onready={(ready) => (leftReady = ready)}
			paired
			palette={palettes.left}
			{paletteOn}
		/>
		<ComparisonStage
			artwork={right}
			changeable={onchange !== undefined}
			heading={headings?.[1]}
			{loupe}
			onchange={() => onchange?.('right')}
			onready={(ready) => (rightReady = ready)}
			paired
			palette={palettes.right}
			{paletteOn}
		/>
	</div>

	<div class="details">
		{@render children()}
	</div>
</div>

<style>
	.pair {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.corner {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		z-index: 3;
		display: flex;
		align-items: center;
	}

	.stages {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.details {
		--form-actions-bleed: var(--spacing-4);

		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--spacing-4);
		padding-inline: var(--spacing-4);
	}

	@media (min-width: 768px) {
		.details {
			--form-actions-bleed: var(--spacing-6);

			padding-inline: var(--spacing-6);
		}

		.pair {
			height: 100%;
			min-height: 0;
			overflow-y: auto;
		}
	}
</style>
