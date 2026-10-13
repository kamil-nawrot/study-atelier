<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import type { CardIndexRecord } from '../types.ts';

	type Props = {
		records: CardIndexRecord[];
		empty: string;
		onopen: (id: string) => void;
	};

	let { records, empty, onopen }: Props = $props();
</script>

{#if records.length === 0}
	<p class="lead">{empty}</p>
{:else}
	<ul>
		{#each records as record (record.id)}
			<li>
				<button
					aria-label={m.cardIndex.openValue(record.name, m.atelier.count(record.count))}
					onclick={() => onopen(record.id)}
					type="button"
				>
					<span class="name">{record.name}</span>
					<span class="count">{record.count}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: grid;
		gap: var(--spacing-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-3);
		padding: 0;
		border: none;
		background: none;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-align: left;
		cursor: pointer;
	}

	button:hover .name {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
	}
</style>
