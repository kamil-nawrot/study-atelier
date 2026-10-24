<script lang="ts">
	import type { NoteLinks } from '../../types/note-links';
	import type { NoteTerm } from '../../types/note-term';
	import type { Snippet } from 'svelte';
	import { renderNotes, renderText } from '../../notes-markdown/notes-markdown';
	import { PopoverState } from '../../popover-state/popover-state.svelte';
	import PopoverCard from '../PopoverCard/PopoverCard.svelte';

	type Props = {
		value: string;
		links?: Pick<NoteLinks, 'resolve'>;
		terms?: NoteTerm[];
		termCard?: Snippet<[string]>;
		interactive?: boolean;
		plain?: boolean;
	};

	let { value, links, terms, termCard, interactive = false, plain = false }: Props = $props();

	const id = $props.id();
	const cardId = `${id}-card`;
	const termId = `${id}-term`;
	const popover = new PopoverState();

	let activeTerm = $state<string>();

	const html = $derived.by(() => {
		const marked = termCard ? terms : undefined;
		return plain ? renderText(value, marked) : renderNotes(value, links, marked);
	});

	function termOf(target: EventTarget | null): HTMLElement | undefined {
		const element = target instanceof Element ? target.closest<HTMLElement>('[data-term]') : null;
		return element ?? undefined;
	}

	function open(term: HTMLElement): void {
		activeTerm = term.dataset.term;
	}

	function listen(node: HTMLElement): () => void {
		const handlers: [string, (event: Event) => void][] = [
			[
				'pointerover',
				(event) => {
					const term = termOf(event.target);
					if (!term) return;
					open(term);
					popover.pointerEnter(term, event as PointerEvent);
				}
			],
			[
				'pointerout',
				(event) => {
					if (termOf(event.target)) popover.pointerLeave(event as PointerEvent);
				}
			],
			[
				'click',
				(event) => {
					const term = termOf(event.target);
					if (!term) return;
					open(term);
					popover.toggle(term);
				}
			],
			[
				'focusin',
				(event) => {
					const term = termOf(event.target);
					if (!term) return;
					open(term);
					popover.focus(term);
				}
			],
			[
				'focusout',
				(event) => {
					if (termOf(event.target)) popover.blur(event as FocusEvent);
				}
			]
		];
		for (const [name, handler] of handlers) node.addEventListener(name, handler);
		return () => {
			for (const [name, handler] of handlers) node.removeEventListener(name, handler);
		};
	}

	$effect(() => {
		const anchor = popover.anchor;
		if (!anchor?.isConnected) return;
		const open = popover.open;
		anchor.setAttribute('aria-expanded', String(open));
		anchor.setAttribute('aria-controls', cardId);
		if (open) {
			anchor.id = termId;
			anchor.setAttribute('aria-describedby', cardId);
		}
		return () => {
			anchor.removeAttribute('id');
			anchor.removeAttribute('aria-describedby');
		};
	});
</script>

<div
	class="notes"
	class:plain
	{@attach (node) => {
		node.innerHTML = html;
		popover.hide();
	}}
	{@attach listen}
></div>

{#if termCard}
	<PopoverCard id={cardId} {interactive} labelledby={termId} {popover}>
		{#if activeTerm}
			{@render termCard(activeTerm)}
		{/if}
	</PopoverCard>
{/if}

<style>
	.notes {
		display: grid;
		gap: var(--spacing-3);
		overflow-wrap: anywhere;
	}

	.plain {
		display: block;
		white-space: pre-line;
	}

	.notes :global(h3) {
		font-weight: var(--font-weight-medium);
	}

	.notes :global(a) {
		text-decoration-color: var(--color-fg-muted);
	}

	.notes :global(ul),
	.notes :global(ol) {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}

	.notes :global(button[data-term]) {
		padding: 0 var(--spacing-1);
		border: none;
		background: var(--color-tag);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.notes :global(button[data-term]:focus-visible) {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}
</style>
