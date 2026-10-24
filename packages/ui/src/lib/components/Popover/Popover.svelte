<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PopoverState } from '../../popover-state/popover-state.svelte';
	import PopoverCard from '../PopoverCard/PopoverCard.svelte';

	type Props = {
		children: Snippet;
		content: Snippet;
	};

	let { children, content }: Props = $props();

	const id = $props.id();
	const cardId = `${id}-card`;
	const popover = new PopoverState();

	let trigger: HTMLButtonElement | undefined = $state();
</script>

<span class="popover">
	<button
		bind:this={trigger}
		class="trigger"
		aria-controls={cardId}
		aria-describedby={popover.open ? cardId : undefined}
		aria-expanded={popover.open}
		onblur={() => popover.blur()}
		onclick={() => trigger && popover.toggle(trigger)}
		onfocus={() => trigger && popover.focus(trigger)}
		onpointerenter={(event) => trigger && popover.pointerEnter(trigger, event)}
		onpointerleave={(event) => popover.pointerLeave(event)}
		type="button"
	>
		{@render children()}
	</button>
	<PopoverCard id={cardId} {popover}>
		{@render content()}
	</PopoverCard>
</span>

<style>
	.popover {
		display: inline-flex;
	}

	.trigger {
		display: inline-flex;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: inherit;
		cursor: pointer;
	}

	.trigger:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}
</style>
