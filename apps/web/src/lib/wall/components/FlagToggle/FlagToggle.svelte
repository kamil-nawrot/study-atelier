<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import { Icon, ToggleTag } from '@study-atelier/ui';

	type Props = {
		icon: LucideIcon;
		label: string;
		count: number;
		pressed: boolean;
		filled?: boolean;
		onclick: () => void;
	};

	let { icon, label, count, pressed, filled = false, onclick }: Props = $props();
</script>

<div class="flag" class:filled>
	<ToggleTag {count} {onclick} {pressed}>
		<Icon {icon} size="sm" />
		{label}
	</ToggleTag>
</div>

<style>
	.flag :global(.label) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.flag :global(svg) {
		width: var(--font-size-md);
		height: var(--font-size-md);
	}

	.filled :global([aria-pressed='true'] svg) {
		fill: currentColor;
	}
</style>
