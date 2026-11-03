<script lang="ts">
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import { Icon, Tooltip } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		count: string;
	};

	let { count }: Props = $props();
</script>

<Tooltip align="end" placement="bottom" text={m.statistics.title}>
	{#snippet children(id)}
		<a
			class="caption"
			aria-describedby={id}
			aria-label={m.statistics.wallLink(count)}
			href={resolve('/(app)/atelier/statistics')}
		>
			{count}
			<Icon icon={ChartColumn} size="sm" />
		</a>
	{/snippet}
</Tooltip>

<style>
	a {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
		text-decoration: none;
	}

	a:hover {
		color: var(--color-fg);
	}
</style>
