<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { Icon } from '@study-atelier/ui';

	type Props = {
		index: number;
		answer: number;
		chosen?: number;
	};

	let { index, answer, chosen }: Props = $props();

	let answered = $derived(chosen !== undefined);
</script>

{#if answered && index === answer}
	<Icon icon={Check} size="sm" />
{:else if answered && index === chosen}
	<Icon icon={X} size="sm" />
{:else}
	{index + 1}
{/if}
