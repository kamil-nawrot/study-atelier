<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
</script>

<a class="back" href={resolve('/(app)/atelier')}>
	<Icon icon={ArrowLeft} />
	{m.artworkView.back}
</a>

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}
</style>
