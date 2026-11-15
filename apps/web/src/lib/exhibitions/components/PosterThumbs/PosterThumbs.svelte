<script lang="ts">
	import { NoImage } from '@study-atelier/ui';

	type Thumb = { id: string; label: string; src?: string };

	type Props = {
		items: readonly Thumb[];
		chosen?: string;
		onchoose: (id: string) => void;
	};

	let { items, chosen, onchoose }: Props = $props();
</script>

<ul class="thumbs">
	{#each items as item (item.id)}
		<li>
			<button
				class="thumb"
				aria-label={item.label}
				aria-pressed={item.id === chosen}
				onclick={() => onchoose(item.id)}
				title={item.label}
				type="button"
			>
				{#if item.src}
					<img alt="" loading="lazy" src={item.src} />
				{:else}
					<NoImage />
				{/if}
			</button>
		</li>
	{/each}
</ul>

<style>
	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		margin: 0;
		padding: var(--spacing-1);
		list-style: none;
	}

	.thumb {
		display: grid;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		overflow: hidden;
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-mat-window);
		cursor: pointer;
	}

	.thumb[aria-pressed='true'] {
		outline: var(--border-width-base) solid var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.thumb:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
