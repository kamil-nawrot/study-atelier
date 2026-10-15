<script lang="ts">
	import { Icon, Notes, Section } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { eraIcon } from '../eras.ts';
	import { subjectName, valueKindName, valuePath, type ValueParent } from '../value-pages.ts';
	import type { ValueDetails, ValueSubject } from '../types.ts';

	type Props = {
		subject: ValueSubject;
		parents: ValueParent[];
		count: number;
		details: ValueDetails;
	};

	let { subject, parents, count, details }: Props = $props();

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
		<p class="empty">{m.valuePage.kinds[subject.kind].noNotes}</p>
	{:else}
		{#if details.summary}
			<Section>
				<p class="summary">{details.summary}</p>
			</Section>
		{/if}
		{#if details.notes}
			<section class="notes" aria-labelledby="value-notes">
				<h2 id="value-notes" class="label">{m.valuePage.notes}</h2>
				<Notes value={details.notes} />
			</section>
		{/if}
	{/if}
</article>

<style>
	article,
	header,
	.notes {
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

	.kind,
	.label {
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
		color: var(--color-fg);
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

	.label {
		font-weight: var(--font-weight-regular);
	}

	.empty {
		color: var(--color-fg-muted);
	}
</style>
