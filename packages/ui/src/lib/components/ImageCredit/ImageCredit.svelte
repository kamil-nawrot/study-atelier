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

	.stage {
		top: var(--spacing-2);
		left: var(--spacing-2);
		color: var(--color-stage-fg);
	}

	.mat {
		top: 0;
		left: 0;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg-muted);
	}

	.icon {
		display: flex;
		padding: var(--spacing-2);
	}

	.stage .icon {
		opacity: 0.6;
	}

	.mat .icon {
		padding: var(--spacing-1);
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
