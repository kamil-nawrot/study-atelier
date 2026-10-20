<script lang="ts">
	import { Tag, TextButton } from '@study-atelier/ui';
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
					{#if parts.value}
						<span class="value">{parts.value}</span>
					{/if}
				</Tag>
			</li>
		{/each}
		<li>
			<TextButton onclick={onclear}>
				{m.atelier.filters.clear}
			</TextButton>
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
		margin-inline-end: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
