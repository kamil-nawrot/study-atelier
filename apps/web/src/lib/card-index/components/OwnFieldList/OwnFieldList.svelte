<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { Icon, IconButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { artworkTypeIcon } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { ownFieldPath } from '#lib/card-index/own-field-pages/own-field-pages.ts';
	import type { OwnField } from '#lib/card-index/types/own-field.ts';

	type Props = {
		fields: OwnField[];
		reordering?: boolean;
		moving?: boolean;
		onmove?: (field: OwnField, direction: -1 | 1) => void;
	};

	let { fields, reordering = false, moving = false, onmove }: Props = $props();
</script>

{#snippet label(field: OwnField)}
	<span class="main">
		<span class="name">{field.name}</span>
		<span class="detail">{m.ownFields.kinds[field.kind]}</span>
		{#each field.typeCodes as code (code)}
			<span class="icon">
				<Icon icon={artworkTypeIcon(code)} label={m.artworkTypes[code]} size="sm" />
			</span>
		{/each}
	</span>
{/snippet}

<ul>
	{#each fields as field, index (field.id)}
		<li>
			{#if reordering}
				<div class="record">
					{@render label(field)}
					<span class="arrows">
						<IconButton
							disabled={moving || index === 0}
							icon={ArrowUp}
							label={m.ownFields.moveFieldUp(field.name)}
							onclick={() => onmove?.(field, -1)}
						/>
						<IconButton
							disabled={moving || index === fields.length - 1}
							icon={ArrowDown}
							label={m.ownFields.moveFieldDown(field.name)}
							onclick={() => onmove?.(field, 1)}
						/>
					</span>
				</div>
			{:else}
				<a
					class="record link"
					aria-label={m.cardIndex.openValue(field.name, m.atelier.count(field.count))}
					href={ownFieldPath(field.id)}
				>
					{@render label(field)}
					<span class="count">{m.atelier.count(field.count)}</span>
				</a>
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		margin: 0;
		padding: 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
		list-style: none;
	}

	li {
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.record {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-4);
		padding: var(--spacing-4) var(--spacing-3);
		color: var(--color-fg);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xl);
		text-decoration: none;
	}

	@media (prefers-reduced-motion: no-preference) {
		.link {
			transition: background var(--duration-short) ease-out;
		}
	}

	.link:hover {
		background: var(--color-tag);
	}

	.main {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-3);
		min-width: 0;
	}

	.icon {
		display: inline-flex;
		align-self: center;
		color: var(--color-fg-muted);
	}

	.detail,
	.count {
		color: var(--color-fg-muted);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-regular);
	}

	.count {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.arrows {
		display: flex;
		gap: var(--spacing-2);
	}
</style>
