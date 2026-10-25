<script lang="ts">
	import type { SuggestionState } from '../../types/suggestion-state';
	import type { UiMessages } from '../../types/ui-messages';
	import { overlayScrollbar } from '../../overlay-scrollbar/overlay-scrollbar.ts';

	type Props = {
		id: string;
		suggestion: SuggestionState | null;
		selected: number;
		messages: UiMessages['notesEditor'];
	};

	let { id, suggestion, selected, messages }: Props = $props();

	let listElement = $state<HTMLUListElement>();

	$effect(() => {
		if (suggestion && suggestion.items.length > 0) {
			listElement?.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

<ul
	bind:this={listElement}
	{id}
	class="list"
	{@attach overlayScrollbar()}
	aria-label={messages.linkSuggestions}
	hidden={!suggestion}
	role="listbox"
>
	{#if suggestion}
		{#each suggestion.items as option, index (option.href)}
			<li
				id={`${id}-${index}`}
				class:active={index === selected}
				aria-selected={index === selected}
				onpointerdown={(event) => event.preventDefault()}
				onpointerup={() => suggestion?.choose(option)}
				role="option"
			>
				<span>{option.name}</span>
				<small>{option.detail}</small>
			</li>
		{:else}
			{#if !suggestion.loading}
				<li class="empty" role="presentation">
					{suggestion.trigger === '@' ? messages.noValueFound : messages.noArtworkFound}
				</li>
			{/if}
		{/each}
	{/if}
</ul>

<style>
	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		right: calc(-1 * var(--border-width-base));
		left: calc(-1 * var(--border-width-base));
		z-index: 1;
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

	[role='option'],
	.empty {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2) var(--spacing-3);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	[role='option'] {
		cursor: pointer;
	}

	[role='option'].active {
		background: var(--color-tag);
	}

	[role='option'] small {
		align-self: center;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-align: right;
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
