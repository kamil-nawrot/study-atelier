<script lang="ts" module>
	import { overlayScrollbar } from '../../overlay-scrollbar/overlay-scrollbar.ts';
	import { dropPlacement } from '../../drop-placement/drop-placement.ts';
</script>

<script lang="ts">
	import type { ValueOption } from '../../types/value-option';
	import { uiMessages } from '../../messages/messages';

	type Props = {
		listId: string;
		label: string;
		options: readonly ValueOption[];
		activeIndex: number;
		expanded: boolean;
		optionId: (option: ValueOption) => string;
		onpick: (option: ValueOption) => void;
	};

	let { listId, label, options, activeIndex, expanded, optionId, onpick }: Props = $props();

	const texts = uiMessages().valueField;

	const existing = $derived(options.filter((option) => option.kind === 'existing'));
	const starter = $derived(options.filter((option) => option.kind === 'starter'));
	const similar = $derived(options.find((option) => option.kind === 'similar'));
	const added = $derived(options.find((option) => option.kind === 'new'));

	function onoptionpointerdown(event: PointerEvent): void {
		event.preventDefault();
	}
</script>

{#snippet item(option: ValueOption, text: string, note?: string)}
	<li
		id={optionId(option)}
		class={option.kind}
		class:active={options.indexOf(option) === activeIndex}
		aria-selected={options.indexOf(option) === activeIndex}
		onpointerdown={onoptionpointerdown}
		onpointerup={() => onpick(option)}
		role="option"
	>
		<span>{text}</span>
		{#if note}
			<small>{note}</small>
		{/if}
	</li>
{/snippet}

{#snippet group(members: ValueOption[], name: string, title: string)}
	{#if members.length > 0}
		<li role="presentation">
			<ul aria-labelledby={`${listId}-${name}`} role="group">
				<li id={`${listId}-${name}`} class="group" role="presentation">{title}</li>
				{#each members as option (option.id ?? option.name)}
					{@render item(option, option.name, option.note)}
				{/each}
			</ul>
		</li>
	{/if}
{/snippet}

<ul
	id={listId}
	class="list"
	{@attach overlayScrollbar()}
	{@attach dropPlacement()}
	aria-label={label}
	hidden={!expanded}
	role="listbox"
>
	{#each options.filter((option) => option.kind === 'found') as option (option.id ?? option.name)}
		{@render item(option, option.name, option.note)}
	{/each}
	{#if similar}
		{@render item(similar, texts.similar(similar.name), texts.useSimilar)}
	{/if}
	{@render group(existing, 'existing', texts.existing)}
	{@render group(starter, 'starter', texts.starter)}
	{#if added}
		{@render item(added, similar ? texts.addAnyway(added.name) : texts.add(added.name))}
	{/if}
</ul>

<style>
	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		right: calc(-1 * var(--border-width-base));
		left: calc(-1 * var(--border-width-base));
		z-index: 2;
		max-height: 280px;
		margin: 0;
		padding: var(--spacing-1) 0;
		overflow-y: auto;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		list-style: none;
	}

	.list[hidden] {
		display: none;
	}

	.list ul {
		margin: 0;
		list-style: none;
	}

	[role='option'] {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		cursor: pointer;
	}

	[role='option'].active {
		background: var(--color-tag);
	}

	[role='option'] small {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.group {
		padding: var(--spacing-2) var(--spacing-3) 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-xs);
		text-transform: uppercase;
	}

	.similar {
		flex-direction: column;
		gap: 0;
		border-left: var(--border-width-button) solid var(--color-line);
	}

	.new {
		font-weight: var(--font-weight-medium);
	}

	.similar ~ .new {
		color: var(--color-fg-muted);
		font-weight: var(--font-weight-regular);
	}
</style>
