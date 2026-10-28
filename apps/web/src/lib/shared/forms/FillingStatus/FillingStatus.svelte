<script lang="ts">
	import { TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		message: string;
		onstop?: () => void;
	};

	let { message, onstop }: Props = $props();
</script>

<p class="filling" role="status">
	<span>{message}</span>
	{#if onstop}
		<TextButton inline onclick={onstop}>{m.common.stopFetch}</TextButton>
	{/if}
</p>

<style>
	.filling {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-3);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
