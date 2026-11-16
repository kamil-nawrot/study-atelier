<script lang="ts" module>
	import Flag from '@lucide/svelte/icons/flag';
	import type { MoreAction } from '#lib/shared/types/more-action.ts';
	import { m } from '#lib/i18n/i18n.ts';

	export function flagLabel(count = 0): string {
		return count > 0 ? m.backroom.markedCount(count) : m.backroom.flag;
	}

	export function flagAction(onclick: () => void, count = 0): MoreAction {
		return { label: flagLabel(count), icon: Flag, onclick };
	}
</script>

<script lang="ts">
	import { Button, Icon } from '@study-atelier/ui';

	type Props = {
		onclick: () => void;
		count?: number;
	};

	let { onclick, count = 0 }: Props = $props();
</script>

<Button aria-label={flagLabel(count)} {onclick}>
	<span class="mark" class:filled={count > 0}>
		<Icon icon={Flag} size="sm" />
	</span>
</Button>

<style>
	.mark {
		display: flex;
	}

	.mark.filled {
		color: var(--color-highlight);
	}

	.mark.filled :global(svg) {
		fill: currentColor;
	}
</style>
