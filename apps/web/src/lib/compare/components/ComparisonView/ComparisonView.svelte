<script lang="ts">
	import { overlayScrollbar } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import { compareHref } from '#lib/compare/compare-address/compare-address.ts';
	import { comparisonRows } from '#lib/compare/comparison-rows/comparison-rows.ts';
	import ComparisonPair from '#lib/compare/components/ComparisonPair/ComparisonPair.svelte';
	import ComparisonPicker from '#lib/compare/components/ComparisonPicker/ComparisonPicker.svelte';
	import ComparisonRows from '#lib/compare/components/ComparisonRows/ComparisonRows.svelte';
	import ComparisonStage from '#lib/compare/components/ComparisonStage/ComparisonStage.svelte';
	import { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
	import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
	import { PaletteLoader } from '#lib/images/palette-loader/palette-loader.svelte.ts';

	type Props = {
		sides: CompareSides;
		left?: ArtworkRecord;
		right?: ArtworkRecord;
		ownFields?: OwnFieldDefinition[];
	};

	let { sides, left, right, ownFields = [] }: Props = $props();

	const loupe = new SharedLoupe();
	const palette = new PaletteLoader();

	function show(next: CompareSides): void {
		void goto(compareHref(next) as ResolvedPathname, { replaceState: true });
	}

	function clear(side: keyof CompareSides): void {
		show({ ...sides, [side]: null });
	}
</script>

{#snippet half(artwork: ArtworkRecord | undefined, side: keyof CompareSides)}
	<div class="half" {@attach overlayScrollbar()}>
		{#if artwork}
			<ComparisonStage
				{artwork}
				changeable={false}
				{loupe}
				onchange={() => clear(side)}
				onready={() => {}}
				{palette}
				paletteOn={false}
			/>
		{:else}
			<ComparisonPicker empty={side} other={side === 'left' ? right : left} {sides} />
		{/if}
	</div>
{/snippet}

{#if left && right}
	<ComparisonPair {left} onchange={clear} {right}>
		<ComparisonRows rows={comparisonRows(left, right, ownFields)} />
	</ComparisonPair>
{:else}
	<div class="view">
		{@render half(left, 'left')}
		{@render half(right, 'right')}
	</div>
{/if}

<style>
	.view {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.half {
		display: grid;
		min-width: 0;
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
