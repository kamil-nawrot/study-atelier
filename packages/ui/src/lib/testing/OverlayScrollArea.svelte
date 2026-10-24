<script lang="ts">
	import type { ScrollAxis } from '../types/scroll-axis';
	import { overlayScrollbar } from '../overlay-scrollbar/overlay-scrollbar.ts';

	type Props = {
		rows?: number;
		axis?: ScrollAxis;
	};

	let { rows = 40, axis = 'y' }: Props = $props();
</script>

{#if axis === 'y'}
	<div
		style:height="200px"
		style:width="240px"
		style:overflow="auto"
		{@attach overlayScrollbar()}
		data-testid="area"
	>
		{#each { length: rows }, row (row)}
			<p style:height="40px" style:margin="0">Row {row + 1}</p>
		{/each}
	</div>
{:else}
	<div
		style:display="flex"
		style:width="200px"
		style:overflow="auto"
		{@attach overlayScrollbar('x')}
		data-testid="area"
	>
		{#each { length: rows }, row (row)}
			<span style:flex="none" style:width="40px">{row + 1}</span>
		{/each}
	</div>
{/if}
