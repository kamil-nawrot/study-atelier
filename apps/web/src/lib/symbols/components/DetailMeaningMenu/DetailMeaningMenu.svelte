<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { Icon, PopupButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';

	type Props = {
		meanings: readonly SymbolMeaning[];
		current: string | null;
		onchoose: (meaningId: string | null) => void;
	};

	let { meanings, current, onchoose }: Props = $props();

	let popup: ReturnType<typeof PopupButton> | undefined = $state();

	const choices = $derived([
		...meanings.map((meaning, index) => ({
			id: meaning.id as string | null,
			number: String(index + 1),
			text: meaning.text
		})),
		{ id: null, number: '', text: m.symbols.view.withoutMeaning }
	]);

	function choose(id: string | null): void {
		popup?.close();
		if (id !== current) onchoose(id);
	}
</script>

<PopupButton bind:this={popup} align="end" bare label={m.symbols.view.changeMeaning}>
	{#snippet trigger()}
		<span class="more"><Icon icon={Ellipsis} size="sm" /></span>
	{/snippet}
	<p class="title">{m.symbols.view.changeMeaning}</p>
	<ul class="choices">
		{#each choices as choice (choice.id)}
			<li>
				<button
					class="choice"
					aria-current={choice.id === current ? 'true' : undefined}
					onclick={() => choose(choice.id)}
					type="button"
				>
					<span class="check">
						{#if choice.id === current}<Icon icon={Check} size="sm" />{/if}
					</span>
					{#if choice.number}<span class="number">{choice.number}</span>{/if}
					<span class="text">{choice.text}</span>
				</button>
			</li>
		{/each}
	</ul>
</PopupButton>

<style>
	.more {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		clip-path: circle(50%);
		background: var(--color-surface);
		color: var(--color-fg-muted);
	}

	.more:hover {
		color: var(--color-fg);
	}

	.title {
		padding: var(--spacing-2) var(--spacing-2) var(--spacing-1);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.choices {
		display: grid;
		min-width: calc(5 * var(--size-control));
		max-width: var(--size-content-narrow);
		margin: 0;
		list-style: none;
	}

	.choice {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
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

	.check {
		display: inline-flex;
		flex: none;
		width: var(--spacing-4);
		align-self: center;
	}

	.number {
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
