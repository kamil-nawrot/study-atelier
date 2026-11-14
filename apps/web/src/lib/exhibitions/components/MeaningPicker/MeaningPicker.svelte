<script lang="ts">
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		meanings: readonly { id: string; text: string }[];
		meaningId?: string;
		onpick: (meaningId?: string) => void;
	};

	let { meanings, meaningId, onpick }: Props = $props();

	let open = $state(false);

	const chosen = $derived(
		meanings.some((meaning) => meaning.id === meaningId) ? meaningId : undefined
	);
	const options = $derived([{ id: undefined, text: m.exhibitions.bar.allMeanings }, ...meanings]);

	function choose(next?: string): void {
		open = false;
		onpick(next);
	}

	function leave(event: FocusEvent): void {
		const next = event.relatedTarget;
		if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) {
			open = false;
		}
	}
</script>

<span
	class="picker"
	onfocusout={leave}
	onkeydown={(event) => event.key === 'Escape' && (open = false)}
	role="presentation"
>
	<button
		aria-expanded={open}
		aria-label={m.exhibitions.bar.meaning}
		aria-pressed={chosen !== undefined}
		onclick={() => (open = !open)}
		title={m.exhibitions.bar.meaning}
		type="button"
	>
		<ListFilter aria-hidden="true" size={16} />
	</button>
	{#if open}
		<span class="list" aria-label={m.exhibitions.bar.meaning} role="group">
			{#each options as option (option.id ?? '')}
				<button
					class="option"
					aria-pressed={option.id === chosen}
					onclick={() => choose(option.id)}
					type="button"
				>
					{option.text}
				</button>
			{/each}
		</span>
	{/if}
</span>

<style>
	.picker {
		position: relative;
		display: inline-flex;
	}

	.list {
		position: absolute;
		z-index: 1;
		top: 100%;
		right: 0;
		display: grid;
		width: max-content;
		max-width: var(--size-content-narrow);
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-bg);
	}

	.picker .option {
		justify-items: start;
		padding: 0 var(--spacing-3);
		color: var(--color-fg);
		text-align: start;
	}
</style>
