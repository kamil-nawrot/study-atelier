<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Count, IconButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ActionMenu from '#lib/shared/navigation/ActionMenu/ActionMenu.svelte';
	import ContextTags from '#lib/symbols/components/ContextTags/ContextTags.svelte';
	import SymbolDetails from '#lib/symbols/components/SymbolDetails/SymbolDetails.svelte';
	import type { MeaningSection } from '#lib/symbols/types/meaning-section.ts';

	type Props = {
		section: MeaningSection;
		number: number;
		pinsShown: boolean;
		coverPinId?: string;
		onsetcover?: (pinId: string | null) => void;
		reordering?: boolean;
		moving?: boolean;
		first?: boolean;
		last?: boolean;
		onedit?: () => void;
		onassign?: () => void;
		onremove?: () => void;
		onmove?: (step: -1 | 1) => void;
	};

	let {
		section,
		number,
		pinsShown,
		coverPinId,
		onsetcover,
		reordering = false,
		moving = false,
		first = false,
		last = false,
		onedit,
		onassign,
		onremove,
		onmove
	}: Props = $props();

	const text = $derived(section.meaning.text);
</script>

<section class="meaning" aria-labelledby="meaning-{section.meaning.id}">
	<div class="head">
		<h2 id="meaning-{section.meaning.id}">
			<span class="number">{number}</span>
			<span class="text">{text}</span>
			<Count value={section.details.length} />
		</h2>
		{#if reordering && onmove}
			<span class="arrows">
				<IconButton
					disabled={moving || first}
					icon={ArrowUp}
					label={m.symbols.meaningDialog.moveUp(text)}
					onclick={() => onmove(-1)}
				/>
				<IconButton
					disabled={moving || last}
					icon={ArrowDown}
					label={m.symbols.meaningDialog.moveDown(text)}
					onclick={() => onmove(1)}
				/>
			</span>
		{:else if onedit && onassign && onremove}
			<ActionMenu
				bare
				actions={[
					{ label: m.symbols.meaningDialog.edit, icon: Pencil, onclick: onedit },
					{ label: m.symbols.meaningDialog.assign, icon: ListChecks, onclick: onassign },
					{ label: m.symbols.meaningDialog.remove, icon: Trash, onclick: onremove, danger: true }
				]}
				label={m.symbols.meaningDialog.actions(text)}
			/>
		{/if}
	</div>
	<ContextTags contexts={section.meaning.contexts} />
	{#if section.details.length > 0}
		<SymbolDetails {coverPinId} details={section.details} {onsetcover} />
	{:else if pinsShown}
		<p class="empty">{m.symbols.view.noDetails}</p>
	{/if}
</section>

<style>
	.meaning {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-4);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	h2 {
		min-width: 0;
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	h2 > :global(*) {
		vertical-align: middle;
	}

	.number {
		padding-right: var(--spacing-2);
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}

	.text {
		padding-right: var(--spacing-2);
		font-style: italic;
	}

	.arrows {
		display: flex;
		flex: none;
		gap: var(--spacing-2);
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
