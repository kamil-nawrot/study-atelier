<script lang="ts" module>
	import Flag from '@lucide/svelte/icons/flag';
	import type { MoreAction } from '#lib/shared/types/more-action.ts';
	import { m } from '#lib/i18n/i18n.ts';

	export function flagAction(onclick: () => void): MoreAction {
		return { label: m.backroom.flag, icon: Flag, onclick };
	}
</script>

<script lang="ts">
	import { Button, Icon } from '@study-atelier/ui';

	type Props = {
		onclick: () => void;
	};

	let { onclick }: Props = $props();
</script>

<Button aria-label={m.backroom.flag} {onclick}>
	<Icon icon={Flag} size="sm" />
</Button>
