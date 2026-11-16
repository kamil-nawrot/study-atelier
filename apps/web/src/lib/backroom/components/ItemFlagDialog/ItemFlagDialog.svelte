<script lang="ts">
	import FlagDialog from '#lib/backroom/components/FlagDialog/FlagDialog.svelte';
	import { flagsOfGroups } from '#lib/backroom/flag-match/flag-match.ts';
	import { ItemFlags } from '#lib/backroom/item-flags/item-flags.svelte.ts';
	import type { FlagChoicePin } from '#lib/backroom/types/flag-choice-pin.ts';
	import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
	import type { FlagTarget } from '#lib/backroom/types/flag-target.ts';

	type Props = {
		open?: boolean;
		flagsOf: FlagTarget;
		groups: readonly FlagGroup[];
		pins?: readonly FlagChoicePin[];
		onflagged: (message: string) => void;
		oncount?: (count: number) => void;
	};

	let { open = $bindable(false), flagsOf, groups, pins, onflagged, oncount }: Props = $props();

	const flags = new ItemFlags();

	let targetKey = $derived(JSON.stringify(flagsOf));

	$effect(() => {
		void flags.load(JSON.parse(targetKey) as FlagTarget);
	});

	$effect(() => {
		oncount?.(flagsOfGroups(flags.list, groups).length);
	});
</script>

<FlagDialog
	flags={flags.list}
	{groups}
	onchange={() => void flags.load()}
	{onflagged}
	{pins}
	bind:open
/>
