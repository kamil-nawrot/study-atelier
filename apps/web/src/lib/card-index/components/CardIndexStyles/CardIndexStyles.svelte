<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import type { CardIndexEntry } from '#lib/card-index/types/card-index-entry.ts';

	type Props = {
		styles: CardIndexEntry[];
		id?: string;
		nested?: boolean;
	};

	let { styles, id, nested = false }: Props = $props();
</script>

<ul {id} class={['styles', { nested }]}>
	{#each styles as style (style.id)}
		<li>
			<a
				class="record"
				aria-label={m.cardIndex.openValue(style.name, m.atelier.count(style.count))}
				href={valuePath('style', style.id)}
			>
				<span class="name">{style.name}</span>
				<span class="count">{m.atelier.count(style.count)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.styles {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.styles:not(.nested) {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.styles:not(.nested) > li {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.nested {
		padding-block-end: var(--spacing-2);
		padding-inline-start: var(--spacing-6);
	}

	.nested > li {
		border-top: var(--border-width-hairline) solid var(--color-tag);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
		padding: var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-md);
		text-decoration: none;
	}

	.nested .record {
		padding-block: var(--spacing-2);
		padding-inline-start: var(--spacing-2);
		font-weight: var(--font-weight-regular);
	}

	@media (prefers-reduced-motion: no-preference) {
		.record {
			transition: background var(--duration-short) ease-out;
		}
	}

	.record:hover {
		background: var(--color-tag);
	}

	.name {
		min-width: 0;
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
