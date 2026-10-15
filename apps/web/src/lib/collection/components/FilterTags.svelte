<script lang="ts">
	import { Tag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { tagLabel, tagParts } from '../filter.ts';
	import type { FilterTag } from '../types.ts';

	type Props = {
		tags: FilterTag[];
		onremove: (tag: FilterTag) => void;
		onclear: () => void;
	};

	let { tags, onremove, onclear }: Props = $props();
</script>

{#if tags.length > 0}
	<ul aria-label={m.atelier.filters.activeLabel}>
		{#each tags as tag (tag.id)}
			<li>
				<Tag
					onremove={() => onremove(tag)}
					removeLabel={m.atelier.filters.removeTag(tagLabel(tag))}
				>
					{@const parts = tagParts(tag)}
					<span class="field">{parts.field}</span>
					<span class="value">{parts.value}</span>
				</Tag>
			</li>
		{/each}
		<li>
			<button class="clear" onclick={onclear} type="button">
				{m.atelier.filters.clear}
			</button>
		</li>
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.field {
		color: var(--color-fg-muted);
	}

	.value {
		font-weight: var(--font-weight-medium);
	}

	.clear {
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: var(--spacing-1);
		white-space: nowrap;
		cursor: pointer;
	}
</style>
