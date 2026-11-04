<script lang="ts">
	type Props = {
		value: number;
		max: number;
		label: string;
		tone?: 'plain' | 'gold';
		track?: 'muted' | 'dim';
		size?: 'thin' | 'thick';
	};

	let { value, max, label, tone = 'plain', track = 'muted', size = 'thin' }: Props = $props();

	let filled = $derived(max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0);
</script>

<div
	class="meter"
	class:dim={track === 'dim'}
	class:gold={tone === 'gold'}
	class:thick={size === 'thick'}
	aria-label={label}
	aria-valuemax={max}
	aria-valuemin={0}
	aria-valuenow={Math.min(Math.max(value, 0), max)}
	role="meter"
>
	<span style:inline-size="{filled}%" class="fill"></span>
</div>

<style>
	.meter {
		inline-size: 100%;
		block-size: var(--spacing-1);
		background: var(--color-fg-muted);
	}

	.fill {
		display: block;
		block-size: 100%;
		background: var(--color-fg);
	}

	.thick {
		block-size: var(--spacing-2);
	}

	.dim {
		background: var(--color-tag);
	}

	.gold .fill {
		background: var(--color-case-gold);
	}
</style>
