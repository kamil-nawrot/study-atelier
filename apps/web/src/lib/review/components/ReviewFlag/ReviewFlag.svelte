<script lang="ts">
	import Flag from '@lucide/svelte/icons/flag';
	import { Icon, Toast } from '@study-atelier/ui';
	import { onMount } from 'svelte';
	import FlagDialog from '#lib/backroom/components/FlagDialog/FlagDialog.svelte';
	import { flagLabel } from '#lib/backroom/components/FlagButton/FlagButton.svelte';
	import { flagsOfGroups } from '#lib/backroom/flag-match/flag-match.ts';
	import { ItemFlags } from '#lib/backroom/item-flags/item-flags.svelte.ts';
	import { stepGroups } from '#lib/review/flag-groups/flag-groups.ts';
	import { flagQuestion } from '#lib/review/flag-question/flag-question.ts';
	import type { SessionStep } from '#lib/review/types/session-step.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		step: SessionStep;
		chosen?: number;
	};

	let { step, chosen }: Props = $props();

	let open = $state(false);
	let toast: Toast;
	let groups = $derived(stepGroups(step));
	let question = $derived(flagQuestion(step, chosen));
	const flags = new ItemFlags();
	let count = $derived(flagsOfGroups(flags.list, groups).length);

	onMount(() => void flags.load());
</script>

<button
	class="flag"
	class:filled={count > 0}
	aria-label={flagLabel(count)}
	onclick={() => (open = true)}
	type="button"
>
	<Icon icon={Flag} />
	<span class="label">{m.backroom.flag}</span>
</button>

<FlagDialog
	flags={flags.list}
	{groups}
	onchange={() => void flags.load()}
	onflagged={(message) => toast.show(message)}
	{question}
	bind:open
/>

<Toast bind:this={toast} />

<style>
	.flag {
		display: flex;
		align-self: stretch;
		align-items: center;
		gap: var(--spacing-2);
		padding: 0 var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		cursor: pointer;
	}

	.flag.filled > :global(svg) {
		color: var(--color-highlight);
		fill: currentColor;
	}

	.label {
		display: none;
	}

	@media (min-width: 768px) {
		.label {
			display: inline;
		}
	}
</style>
