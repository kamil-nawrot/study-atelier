<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import { valuePath } from '../value-pages.ts';
	import type { CardIndexRecord } from '../types.ts';

	type Props = {
		records: CardIndexRecord[];
		empty: string;
	};

	let { records, empty }: Props = $props();
</script>

{#if records.length === 0}
	<p class="lead">{empty}</p>
{:else}
	<ul>
		{#each records as record (record.id)}
			<li>
				<a
					aria-label={m.cardIndex.openValue(record.name, m.atelier.count(record.count))}
					href={valuePath(record.category, record.id)}
				>
					<span class="name">{record.name}</span>
					<span class="count">{record.count}</span>
				</a>
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

	a {
		display: inline-flex;
		align-items: baseline;
		gap: var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-decoration: none;
	}

	a:hover .name {
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
