<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import { Icon, ToggleTag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		count: number;
		pressed: boolean;
		onclick: () => void;
	};

	let { count, pressed, onclick }: Props = $props();
</script>

<div class="favourites">
	<ToggleTag {count} {onclick} {pressed}>
		<Icon icon={Heart} size="sm" />
		{m.atelier.filters.fields.favourites}
	</ToggleTag>
</div>

<style>
	.favourites :global(.label) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.favourites :global(svg) {
		width: var(--font-size-md);
		height: var(--font-size-md);
	}

	.favourites :global([aria-pressed='true'] svg) {
		fill: currentColor;
	}
</style>
