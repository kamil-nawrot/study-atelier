<script lang="ts">
	import Grid from '@lucide/svelte/icons/grid-3x3';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		ALIGNS,
		VALIGNS,
		type Position
	} from '#lib/exhibitions/editor/block-position/block-position.ts';

	type Props = {
		position: Position;
		onpick: (position: Position) => void;
	};

	let { position, onpick }: Props = $props();

	let open = $state(false);

	function choose(next: Position): void {
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
		aria-label={m.exhibitions.bar.position}
		onclick={() => (open = !open)}
		title={m.exhibitions.bar.position}
		type="button"
	>
		<Grid aria-hidden="true" size={16} />
	</button>
	{#if open}
		<span class="grid" aria-label={m.exhibitions.bar.position} role="group">
			{#each VALIGNS as valign (valign)}
				{#each ALIGNS as align (align)}
					<button
						class="cell"
						aria-label={m.exhibitions.bar.place(valign, align)}
						aria-pressed={position.align === align && position.valign === valign}
						onclick={() => choose({ align, valign })}
						title={m.exhibitions.bar.place(valign, align)}
						type="button"
					>
						<span class="dot" aria-hidden="true"></span>
					</button>
				{/each}
			{/each}
		</span>
	{/if}
</span>

<style>
	.picker {
		position: relative;
		display: inline-flex;
	}

	.grid {
		position: absolute;
		z-index: 1;
		top: 100%;
		right: 0;
		display: grid;
		grid-template-columns: repeat(3, var(--size-control));
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-bg);
	}

	.dot {
		width: var(--spacing-2);
		height: var(--spacing-2);
		background: currentColor;
	}
</style>
