<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		position: number;
		total: number;
	};

	let { position, total }: Props = $props();
</script>

<span class="caption" aria-label={m.albums.closing.listLabel}>
	{m.albums.closing.progress(position, total)}
</span>

<style>
	.caption {
		margin-inline-start: auto;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
