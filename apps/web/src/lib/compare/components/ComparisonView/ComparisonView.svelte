<script lang="ts">
	import Blend from '@lucide/svelte/icons/blend';
	import Search from '@lucide/svelte/icons/search';
	import { StageButton, overlayScrollbar } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import { compareHref } from '#lib/compare/compare-address/compare-address.ts';
	import ComparisonPicker from '#lib/compare/components/ComparisonPicker/ComparisonPicker.svelte';
	import ComparisonStage from '#lib/compare/components/ComparisonStage/ComparisonStage.svelte';
	import { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
	import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
	import { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		sides: CompareSides;
		left?: ArtworkRecord;
		right?: ArtworkRecord;
	};

	let { sides, left, right }: Props = $props();

	const mouse = new MediaQuery('(hover: hover) and (pointer: fine)');
	const loupe = new SharedLoupe();
	const palettes = { left: new PaletteLoader(), right: new PaletteLoader() };

	let paletteOn = $state(false);
	let leftReady = $state(false);
	let rightReady = $state(false);
	let loupeReady = $derived(
		(left !== undefined && leftReady) || (right !== undefined && rightReady)
	);
	let both = $derived(left !== undefined && right !== undefined);
	let statuses = $derived(
		[
			left?.image ? palettes.left.status : undefined,
			right?.image ? palettes.right.status : undefined
		].filter((status) => status !== undefined)
	);
	let paletteOffered = $derived(statuses.length > 0);
	let paletteUnreadable = $derived(
		paletteOffered && statuses.every((status) => status === 'unreadable')
	);

	$effect(() => {
		if (both) return;
		loupe.close();
		paletteOn = false;
	});

	$effect(() => {
		if (!paletteOn) return;
		void palettes.left.load(left?.image);
		void palettes.right.load(right?.image);
	});

	function show(next: CompareSides): void {
		void goto(compareHref(next) as ResolvedPathname, { replaceState: true });
	}

	function clear(side: keyof CompareSides): void {
		show({ ...sides, [side]: null });
	}
</script>

<div class="view">
	{#if both}
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
	{/if}

	<div class="half" {@attach overlayScrollbar()}>
		{#if left}
			<ComparisonStage
				artwork={left}
				changeable={both}
				{loupe}
				onchange={() => clear('left')}
				onready={(ready) => (leftReady = ready)}
				palette={palettes.left}
				{paletteOn}
			/>
		{:else}
			<ComparisonPicker empty="left" other={right} {sides} />
		{/if}
	</div>
	<div class="half" {@attach overlayScrollbar()}>
		{#if right}
			<ComparisonStage
				artwork={right}
				changeable={both}
				{loupe}
				onchange={() => clear('right')}
				onready={(ready) => (rightReady = ready)}
				palette={palettes.right}
				{paletteOn}
			/>
		{:else}
			<ComparisonPicker empty="right" other={left} {sides} />
		{/if}
	</div>
</div>

<style>
	.view {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.half {
		display: grid;
		min-width: 0;
	}

	.corner {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		z-index: 3;
		display: flex;
		align-items: center;
	}

	@media (min-width: 768px) {
		.view {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			height: 100%;
			min-height: 0;
		}

		.half {
			min-height: 0;
			overflow-y: auto;
		}
	}
</style>
