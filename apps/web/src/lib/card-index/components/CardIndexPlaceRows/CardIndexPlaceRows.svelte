<script lang="ts">
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { placeTypeIcon, placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { valuePath } from '#lib/card-index/value-pages/value-pages.ts';
	import type { CardIndexPlace } from '#lib/card-index/types/card-index-place.ts';

	type Props = {
		places: CardIndexPlace[];
		id?: string;
		nested?: boolean;
	};

	let { places, id, nested = false }: Props = $props();
</script>

<ul {id} class={['places', { nested }]}>
	{#each places as place (place.id)}
		<li>
			<a
				class="record"
				aria-label={m.cardIndex.openValue(place.name, m.atelier.count(place.count))}
				href={valuePath('location', place.id)}
			>
				<span class="name">
					{#if place.placeType}
						<span class="type" title={placeTypeName(place.placeType)}>
							<Icon icon={placeTypeIcon(place.placeType)} size="sm" />
						</span>
					{/if}
					{place.name}
				</span>
				<span class="count">{m.atelier.count(place.count)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.places {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.places:not(.nested) {
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.places:not(.nested) > li {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.nested {
		padding-block-end: var(--spacing-2);
		padding-inline-start: calc(var(--spacing-6) + var(--spacing-8));
	}

	.nested > li {
		border-top: var(--border-width-hairline) solid var(--color-tag);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.type {
		display: inline-flex;
		color: var(--color-fg-muted);
	}

	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
