<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Icon, PopupButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ContextTags from '#lib/symbols/components/ContextTags/ContextTags.svelte';
	import SymbolDetails from '#lib/symbols/components/SymbolDetails/SymbolDetails.svelte';
	import type { MeaningSection } from '#lib/symbols/types/meaning-section.ts';

	type Props = {
		section: MeaningSection;
		number: number;
		pinsShown: boolean;
		coverPinId?: string;
		onsetcover?: (pinId: string | null) => void;
		first?: boolean;
		last?: boolean;
		onedit?: () => void;
		onremove?: () => void;
		onmove?: (step: -1 | 1) => void;
	};

	let {
		section,
		number,
		pinsShown,
		coverPinId,
		onsetcover,
		first = false,
		last = false,
		onedit,
		onremove,
		onmove
	}: Props = $props();

	let popup: ReturnType<typeof PopupButton> | undefined = $state();

	function run(action: () => void): void {
		popup?.close();
		action();
	}
</script>

<section class="meaning" aria-labelledby="meaning-{section.meaning.id}">
	<div class="head">
		<h2 id="meaning-{section.meaning.id}">
			<span class="number">{number}</span>
			<span class="text">{section.meaning.text}</span>
		</h2>
		{#if onedit && onremove && onmove}
			<PopupButton bind:this={popup} align="end" label={m.symbols.meaningDialog.actions}>
				{#snippet trigger()}
					<Icon icon={Ellipsis} />
				{/snippet}
				<ul class="actions">
					<li>
						<button class="action" onclick={() => run(onedit)} type="button">
							<Icon icon={Pencil} size="sm" />
							{m.symbols.meaningDialog.edit}
						</button>
					</li>
					{#if !first}
						<li>
							<button class="action" onclick={() => run(() => onmove(-1))} type="button">
								<Icon icon={ArrowUp} size="sm" />
								{m.symbols.meaningDialog.moveUp}
							</button>
						</li>
					{/if}
					{#if !last}
						<li>
							<button class="action" onclick={() => run(() => onmove(1))} type="button">
								<Icon icon={ArrowDown} size="sm" />
								{m.symbols.meaningDialog.moveDown}
							</button>
						</li>
					{/if}
					<li>
						<button class="action danger" onclick={() => run(onremove)} type="button">
							<Icon icon={Trash} size="sm" />
							{m.symbols.meaningDialog.remove}
						</button>
					</li>
				</ul>
			</PopupButton>
		{/if}
	</div>
	<div class="body">
		<div class="about">
			<ContextTags contexts={section.meaning.contexts} />
		</div>
		{#if section.details.length > 0}
			<SymbolDetails {coverPinId} details={section.details} {onsetcover} />
		{:else if pinsShown}
			<p class="empty">{m.symbols.view.noDetails}</p>
		{/if}
	</div>
</section>

<style>
	.meaning {
		--meaning-number: var(--spacing-8);

		display: grid;
		gap: var(--spacing-4);
		padding: var(--spacing-8) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-3);
	}

	.actions {
		display: grid;
		min-width: calc(5 * var(--size-control));
		margin: 0;
		list-style: none;
	}

	.action {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: var(--spacing-3) var(--spacing-2);
		border: none;
		background: none;
		color: var(--color-fg);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.action.danger {
		color: var(--color-danger);
	}

	h2 {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-template-columns: var(--meaning-number) minmax(0, 1fr);
		align-items: baseline;
		gap: var(--spacing-3);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.number {
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}

	.text {
		font-style: italic;
	}

	.body {
		display: grid;
		gap: var(--spacing-4);
		min-width: 0;
		padding-inline-start: calc(var(--meaning-number) + var(--spacing-3));
	}

	.about {
		display: grid;
		gap: var(--spacing-2);
	}

	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	@media (max-width: 767.98px) {
		.meaning {
			--meaning-number: var(--spacing-6);
		}

		h2 {
			font-size: var(--font-size-xl);
			line-height: var(--line-height-xl);
		}
	}
</style>
