<script lang="ts">
	import Copyright from '@lucide/svelte/icons/copyright';
	import Icon from '../Icon/Icon.svelte';
	import Popover from '../Popover/Popover.svelte';

	type Props = {
		text: string;
		label: string;
		tone?: 'stage' | 'mat';
	};

	let { text, label, tone = 'stage' }: Props = $props();
</script>

<span class="image-credit {tone}">
	<Popover {label}>
		<span class="icon">
			<Icon icon={Copyright} size="sm" />
		</span>
		{#snippet content()}
			<span class="text">{text}</span>
		{/snippet}
	</Popover>
</span>

<style>
	.image-credit {
		position: absolute;
		z-index: 3;
		display: flex;
	}

	.stage,
	.mat {
		top: var(--spacing-2);
		left: var(--spacing-2);
		color: var(--color-stage-fg);
	}

	.mat {
		isolation: isolate;
	}

	.mat::before {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: color-mix(in srgb, var(--color-stage-bg) 60%, transparent);
		clip-path: circle(50%);
		content: '';
	}

	.icon {
		display: flex;
		padding: var(--spacing-2);
		opacity: 0.7;
	}

	.image-credit:hover .icon,
	.image-credit:has(:global(:focus-visible)) .icon {
		opacity: 1;
	}

	.text {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
