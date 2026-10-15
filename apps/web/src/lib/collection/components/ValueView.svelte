<script lang="ts">
	import { ArtworkImage, Icon, Notes, Section } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { artworkImageCredit, artworkImageSource } from '../artwork-image.ts';
	import { countryName } from '../countries.ts';
	import { eraIcon } from '../eras.ts';
	import { placeTypeName } from '../place-types.ts';
	import { formatLifeYears } from '../format.ts';
	import { subjectName, valueKindName, valuePath, type ValueParent } from '../value-pages.ts';
	import type { ValueDetails, ValueSubject } from '../types.ts';

	type Props = {
		subject: ValueSubject;
		parents: ValueParent[];
		count: number;
		details: ValueDetails;
	};

	let { subject, parents, count, details }: Props = $props();

	const PORTRAIT_WIDTH = 500;

	let empty = $derived(details.summary === '' && details.notes === '');
	let name = $derived(subjectName(subject));
	let author = $derived(details.author);
	let portrait = $derived(artworkImageSource(author?.image ?? null, PORTRAIT_WIDTH));
	let credit = $derived(artworkImageCredit(author?.image ?? null));
	let lifeYears = $derived(
		author && formatLifeYears(author.birthYear, author.deathYear, author.yearsApproximate)
	);
	let place = $derived(
		[
			details.location?.placeType ? placeTypeName(details.location.placeType) : null,
			details.location?.countryCode ? countryName(details.location.countryCode) : null
		]
			.filter((part) => part !== null)
			.join(' · ')
	);
	let title = $derived(
		subject.kind === 'era' ? `${name.charAt(0).toLocaleUpperCase()}${name.slice(1)}` : name
	);
</script>

<article class:with-portrait={portrait}>
	{#if portrait}
		<figure class="portrait">
			<div class="mat">
				<ArtworkImage
					alt={name}
					height={portrait.height}
					sizes="(min-width: 768px) 320px, 100vw"
					src={portrait.src}
					srcset={portrait.srcset}
					width={portrait.width}
				/>
			</div>
			{#if credit}
				<figcaption class="caption">{credit}</figcaption>
			{/if}
		</figure>
	{/if}
	<div class="text">
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
			{#if lifeYears}
				<p class="caption">{lifeYears}</p>
			{/if}
			{#if place}
				<p class="caption">{place}</p>
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
	</div>
</article>

<style>
	article,
	header,
	.notes {
		display: grid;
		gap: var(--spacing-3);
	}

	article {
		gap: var(--spacing-8);
	}

	.text {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		max-width: var(--size-content-default);
	}

	header {
		gap: var(--spacing-2);
	}

	.portrait {
		display: grid;
		align-self: start;
		gap: var(--spacing-2);
		margin: 0;
	}

	.mat {
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.mat :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
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

	@media (min-width: 768px) {
		article.with-portrait {
			grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
			gap: var(--spacing-12);
		}
	}
</style>
