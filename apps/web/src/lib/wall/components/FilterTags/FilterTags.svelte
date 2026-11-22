<script lang="ts">
	import { Tag, TextButton, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { tagLabel, tagParts } from '#lib/wall/filter-tags/filter-tags.ts';
	import { fittingTags } from '#lib/wall/tag-row/tag-row.ts';
	import type { FilterTag } from '#lib/catalogue/types/filter-tag.ts';

	type Props = {
		tags: FilterTag[];
		onremove: (tag: FilterTag) => void;
		onclear: () => void;
		colour?: (tag: FilterTag) => string | undefined;
		onmore?: () => void;
	};

	let { tags, onremove, onclear, colour, onmore }: Props = $props();

	let room = $state(0);
	let sizes = $state<number[]>([]);
	let gap = $state(0);
	let measure = $state<HTMLElement>();

	let shown = $derived(onmore ? fittingTags(sizes, room, gap) : tags.length);
	let hidden = $derived(tags.length - shown);

	$effect(() => {
		const element = measure;
		if (!element || tags.length === 0) return;
		const read = (): void => {
			gap = parseFloat(getComputedStyle(element).columnGap) || 0;
			sizes = [...element.children].map((child) => child.getBoundingClientRect().width);
		};
		read();
		const observer = new ResizeObserver(read);
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

{#snippet tagItem(tag: FilterTag)}
	<li>
		<Tag onremove={() => onremove(tag)} removeLabel={m.atelier.filters.removeTag(tagLabel(tag))}>
			{@const parts = tagParts(tag)}
			{@const fill = colour?.(tag)}
			{#if fill}
				<svg style:fill class="swatch" aria-hidden="true" height="8" viewBox="0 0 8 8" width="8">
					<circle cx="4" cy="4" r="4" />
				</svg>
			{/if}
			<span class="field">{parts.field}</span>
			{#if parts.value}
				<span class="value">{parts.value}</span>
			{/if}
		</Tag>
	</li>
{/snippet}

{#snippet clearItem()}
	<li>
		<TextButton onclick={onclear}>
			{m.atelier.filters.clear}
		</TextButton>
	</li>
{/snippet}

{#if tags.length > 0}
	<ul class:line={onmore} aria-label={m.atelier.filters.activeLabel} bind:clientWidth={room}>
		{#each tags.slice(0, shown) as tag (tag.id)}
			{@render tagItem(tag)}
		{/each}
		{#if hidden > 0}
			<li>
				<Tooltip text={m.atelier.filters.moreTags(hidden)}>
					{#snippet children(id)}
						<button
							class="more"
							aria-describedby={id}
							aria-label={m.atelier.filters.moreTags(hidden)}
							onclick={onmore}
							type="button">+{hidden}</button
						>
					{/snippet}
				</Tooltip>
			</li>
		{/if}
		{@render clearItem()}
	</ul>
	{#if onmore}
		<div class="measure" aria-hidden="true" inert>
			<ul bind:this={measure} class="line">
				{#each tags as tag (tag.id)}
					{@render tagItem(tag)}
				{/each}
				<li><span class="more">+{tags.length}</span></li>
				{@render clearItem()}
			</ul>
		</div>
	{/if}
{/if}

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
		margin: 0;
		list-style: none;
	}

	.line {
		flex-wrap: nowrap;
		overflow: hidden;
	}

	.line > li {
		flex: none;
	}

	.measure {
		height: 0;
		overflow: hidden;
		visibility: hidden;
	}

	.measure ul {
		width: max-content;
	}

	.more {
		display: inline-flex;
		align-items: center;
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-xs);
		cursor: pointer;
	}

	.more:hover {
		background: var(--color-surface);
	}

	.swatch {
		margin-inline-end: var(--spacing-2);
	}

	.field {
		margin-inline-end: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
