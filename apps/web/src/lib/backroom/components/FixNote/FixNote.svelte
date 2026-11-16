<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Flag from '@lucide/svelte/icons/flag';
	import { Button, Icon, TextButton } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
	import type { FormFlags } from '#lib/backroom/form-flags/form-flags.svelte.ts';
	import type { FixField } from '#lib/backroom/types/fix-field.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		field: FixField;
		flags?: FormFlags;
	};

	let { field, flags }: Props = $props();

	let entry = $derived(fixSession.entryFor(page.url.pathname));
	let missing = $derived(
		entry?.field === field && (entry.flagIds ?? []).length === 0 ? entry.note : undefined
	);
	let notes = $derived(flags?.notes(field) ?? []);
	let focused = $derived(entry?.field === field);

	function bringIntoView(element: HTMLElement): void {
		const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches;
		requestAnimationFrame(() =>
			element.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
		);
	}
</script>

{#if missing || notes.length > 0}
	<div class="notes" {@attach (element) => (focused ? bringIntoView(element) : undefined)}>
		{#if missing}
			<p class="note">
				<Icon icon={Flag} size="sm" />
				<span class="text">{missing}</span>
			</p>
		{/if}
		{#each notes as note (note.id)}
			<div class="note" class:fixed={note.fixed}>
				<Icon icon={note.fixed ? Check : Flag} size="sm" />
				<span class="text">{note.fixed ? m.backroom.markedFixed : note.text}</span>
				{#if note.fixed}
					<TextButton disabled={flags?.busy === note.id} onclick={() => flags?.undo(note.id)}>
						{m.backroom.undo}
					</TextButton>
				{:else}
					<Button
						aria-label={m.backroom.markFixed}
						compact
						disabled={flags?.busy === note.id}
						icon={Check}
						onclick={() => flags?.markFixed(note.id)}
					>
						{m.backroom.markFixed}
					</Button>
				{/if}
				{#if flags?.failed?.id === note.id}
					<span class="error" role="alert">{flags.failed.text}</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.notes {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.note {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2) var(--spacing-3);
		margin: 0;
		padding: var(--spacing-2) var(--spacing-3);
		border-left: var(--border-width-button) solid var(--color-highlight);
		background: var(--color-surface);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.note.fixed {
		border-left-color: var(--color-line);
		color: var(--color-fg-muted);
	}

	.note > :global(svg) {
		flex: none;
		color: var(--color-highlight);
	}

	.note.fixed > :global(svg) {
		color: var(--color-fg-muted);
	}

	.text {
		flex: 1 1 auto;
		min-width: 0;
	}

	.error {
		flex-basis: 100%;
		color: var(--color-danger);
		font-size: var(--font-size-xs);
	}
</style>
