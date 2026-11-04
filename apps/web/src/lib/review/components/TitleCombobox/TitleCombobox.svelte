<script lang="ts">
	import { tick } from 'svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { foldTitle, titleSuggestions } from '#lib/review/typed-title/typed-title.ts';
	import type { TitleSuggestion } from '#lib/review/typed-title/typed-title.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		selected?: TitleSuggestion;
		verdict?: 'right' | 'wrong';
		oncheck: () => void;
	};

	let { artworks, selected = $bindable(), verdict, oncheck }: Props = $props();

	const inputId = $props.id();
	const listId = `${inputId}-list`;

	let field = $state<HTMLElement>();
	let query = $state('');
	let open = $state(false);
	let active = $state(0);

	let answered = $derived(verdict !== undefined);
	let shown = $derived(titleSuggestions(query, artworks));
	let searching = $derived(foldTitle(query).trim().length >= 3 || shown.length > 0);
	let expanded = $derived(open && searching && !answered);
	let activeIndex = $derived(Math.min(active, shown.length - 1));

	function optionId(index: number): string {
		return `${inputId}-option-${index}`;
	}

	function pick(suggestion: TitleSuggestion): void {
		selected = suggestion;
		query = suggestion.title;
		open = false;
	}

	function oninput(): void {
		selected = undefined;
		open = true;
		active = 0;
	}

	async function onfocus(): Promise<void> {
		open = true;
		if (!window.matchMedia('(max-width: 767.98px)').matches) return;
		await tick();
		field?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	function onkeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			open = true;
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = Math.min(Math.max(activeIndex + step, 0), shown.length - 1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (expanded && shown[activeIndex]) pick(shown[activeIndex]);
			else if (selected) oncheck();
		} else if (event.key === 'Escape' && expanded) {
			event.preventDefault();
			event.stopPropagation();
			open = false;
		}
	}
</script>

{#snippet marked(suggestion: TitleSuggestion)}
	{@const { start, end } = suggestion.match}
	<cite class="artwork-title"
		>{suggestion.title.slice(0, start)}<strong>{suggestion.title.slice(start, end)}</strong
		>{suggestion.title.slice(end)}</cite
	>
{/snippet}

<div bind:this={field} class="field">
	<label for={inputId}>{m.review.quiz.typedLabel}</label>
	<div class="control" class:right={verdict === 'right'} class:wrong={verdict === 'wrong'}>
		<input
			id={inputId}
			class:picked={selected !== undefined}
			aria-activedescendant={expanded && shown.length > 0 ? optionId(activeIndex) : undefined}
			aria-autocomplete="list"
			aria-controls={listId}
			aria-expanded={expanded}
			autocomplete="off"
			disabled={answered}
			onblur={() => (open = false)}
			{onfocus}
			{oninput}
			{onkeydown}
			role="combobox"
			spellcheck="false"
			type="text"
			bind:value={query}
		/>
		<ul
			id={listId}
			class="list"
			aria-label={m.review.quiz.typedLabel}
			hidden={!expanded}
			role="listbox"
		>
			{#each shown as suggestion, index (suggestion.key)}
				<li
					id={optionId(index)}
					class:active={index === activeIndex}
					aria-selected={suggestion.key === selected?.key}
					onpointerdown={(event) => event.preventDefault()}
					onpointerup={() => pick(suggestion)}
					role="option"
				>
					{@render marked(suggestion)}
					{#if suggestion.authors.length > 0}
						<span class="authors">{suggestion.authors.join(', ')}</span>
					{/if}
				</li>
			{:else}
				<li class="empty" role="presentation">{m.review.quiz.typedEmpty}</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.field {
		display: grid;
		gap: var(--spacing-2);
		scroll-margin-top: var(--spacing-4);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.control {
		position: relative;
		display: flex;
		align-items: center;
		min-height: var(--size-control);
		padding: 0 var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
	}

	.control:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(var(--border-width-base) + var(--border-width-hairline));
	}

	.control.right {
		border-color: var(--color-success);
	}

	.control.wrong {
		border-color: var(--color-danger);
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	input.picked {
		font-family: var(--font-family-title), Georgia, serif;
		font-style: italic;
	}

	.list {
		position: absolute;
		top: calc(100% + var(--border-width-base));
		right: calc(-1 * var(--border-width-base));
		left: calc(-1 * var(--border-width-base));
		z-index: 1;
		max-height: 380px;
		margin: 0;
		padding: var(--spacing-1) 0;
		overflow-y: auto;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
		list-style: none;
	}

	li {
		display: grid;
		padding: var(--spacing-2) var(--spacing-3);
		cursor: pointer;
	}

	li.active {
		background: var(--color-tag);
	}

	.authors,
	.empty {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.empty {
		cursor: default;
	}
</style>
