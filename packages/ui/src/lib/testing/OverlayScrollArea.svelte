<script lang="ts">
	import { overlayScrollbar } from '../overlay-scrollbar.ts';

	type Props = {
		rows?: number;
	};

	let { rows = 40 }: Props = $props();
</script>

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
