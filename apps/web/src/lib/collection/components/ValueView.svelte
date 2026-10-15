<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button, Icon, Notes } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { eraIcon } from '../eras.ts';
	import { subjectName, valueKindName, valuePath, type ValueParent } from '../value-pages.ts';
	import type { ValueDetails, ValueSubject } from '../types.ts';

	type Props = {
		subject: ValueSubject;
		parents: ValueParent[];
		count: number;
		details: ValueDetails;
		editHref: string;
	};

	let { subject, parents, count, details, editHref }: Props = $props();

	let empty = $derived(details.summary === '' && details.notes === '');
	let name = $derived(subjectName(subject));
	let title = $derived(
		subject.kind === 'era' ? `${name.charAt(0).toLocaleUpperCase()}${name.slice(1)}` : name
	);
</script>

<article>
	<header>
		<p class="kind">
			{#if subject.kind === 'era'}
				<span class="mark" aria-hidden="true">
					<Icon icon={eraIcon(subject.code)} size="sm" />
				</span>
			{/if}
			{m.valuePage.header(valueKindName(subject.kind), m.atelier.count(count))}
		</p>
		<h1>{title}</h1>
		{#if subject.kind === 'era'}
			<p class="caption">{m.eras[subject.code].years}</p>
		{/if}
		{#if parents.length > 0}
			<p class="caption parents">
				{#each parents as parent (parent.id)}
					<a href={valuePath(parent.kind, parent.id)}>
						{#if parent.era}
							<Icon icon={eraIcon(parent.era)} size="sm" />
						{/if}
						{parent.name}
					</a>
				{/each}
			</p>
		{/if}
	</header>

	{#if empty}
		<div class="empty">
			<p>{m.valuePage.kinds[subject.kind].noNotes}</p>
			<div>
				<Button href={editHref}>
					<Icon icon={Pencil} size="sm" />
					{m.valuePage.edit}
				</Button>
			</div>
		</div>
	{:else}
		{#if details.summary}
			<p class="summary">{details.summary}</p>
		{/if}
		{#if details.notes}
			<Notes value={details.notes} />
		{/if}
	{/if}
</article>

<style>
	article,
	header,
	.empty {
		display: grid;
		gap: var(--spacing-3);
	}

	article {
		gap: var(--spacing-6);
		max-width: var(--size-content-default);
	}

	header {
		gap: var(--spacing-2);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.mark {
		display: grid;
		place-items: center;
		padding: var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.parents {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-4);
	}

	.parents a {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		color: var(--color-fg);
		text-underline-offset: 0.2em;
	}

	.summary {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.empty p {
		color: var(--color-fg-muted);
	}
</style>
