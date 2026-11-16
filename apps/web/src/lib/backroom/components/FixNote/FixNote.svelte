<script lang="ts">
	import Flag from '@lucide/svelte/icons/flag';
	import { Icon } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
	import type { FixField } from '#lib/backroom/types/fix-field.ts';

	type Props = {
		field: FixField;
	};

	let { field }: Props = $props();

	let entry = $derived(fixSession.entryFor(page.url.pathname));
	let note = $derived(entry?.field === field ? entry.note : undefined);

	function bringIntoView(element: HTMLElement): void {
		const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches;
		requestAnimationFrame(() =>
			element.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
		);
	}
</script>

{#if note}
	<p class="note" {@attach bringIntoView}>
		<Icon icon={Flag} size="sm" />
		<span>{note}</span>
	</p>
{/if}

<style>
	.note {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-2);
		margin: 0;
		padding: var(--spacing-2) var(--spacing-3);
		border-left: var(--border-width-button) solid var(--color-highlight);
		background: var(--color-surface);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.note > :global(svg) {
		flex: none;
		color: var(--color-highlight);
	}
</style>
