<script lang="ts">
	import {
		ArtworkImage,
		Icon,
		ImageCredit,
		MetaLine,
		type NoteLinks,
		Section
	} from '@study-atelier/ui';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		artworkImageCredit,
		artworkImageSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import { countryName } from '#lib/catalogue/countries/countries.ts';
	import { eraIcon, eraYearsText } from '#lib/catalogue/eras/eras.ts';
	import { placeTypeIcon, placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { formatLifeYears } from '#lib/catalogue/years/years.ts';
	import {
		subjectName,
		valueKindName,
		valuePath
	} from '#lib/card-index/value-pages/value-pages.ts';
	import type { ValueParent } from '#lib/card-index/types/value-parent.ts';
	import type { Mention } from '#lib/notes/types/mention.ts';
	import type { ValueDetails } from '#lib/values/types/value-details.ts';
	import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
	import VisitsDisclosure from '#lib/chronicle/components/VisitsDisclosure/VisitsDisclosure.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import MentionedIn from '#lib/notes/components/MentionedIn/MentionedIn.svelte';
	import NotesSection from '#lib/notes/components/NotesSection/NotesSection.svelte';
	import EraOutsideNote from '#lib/values/components/EraOutsideNote/EraOutsideNote.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		subject: ValueSubject;
		parents: ValueParent[];
		count: number;
		details: ValueDetails;
		noteLinks?: NoteLinks;
		glossary?: GlossaryTerm[];
		mentions?: Mention[];
		visits?: Visit[];
		artworks?: WallArtwork[];
	};

	let {
		subject,
		parents,
		count,
		details,
		noteLinks,
		glossary,
		mentions = [],
		visits = [],
		artworks = []
	}: Props = $props();

	const PORTRAIT_WIDTH = 500;

	let empty = $derived(details.summary === '' && details.notes === '');
	let name = $derived(subjectName(subject));
	let author = $derived(details.author);
	let portrait = $derived(artworkImageSource(author?.image ?? null, PORTRAIT_WIDTH));
	let credit = $derived(artworkImageCredit(author?.image ?? null));
	let lifeYears = $derived(
		author && formatLifeYears(author.birthYear, author.deathYear, author.yearsApproximate)
	);
	let place = $derived([
		details.location?.placeType ? placeTypeName(details.location.placeType) : null,
		details.location?.countryCode ? countryName(details.location.countryCode) : null
	]);
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
				{#if credit}
					<ImageCredit label={m.artwork.creditLabel} text={credit} tone="mat" />
				{/if}
			</div>
		</figure>
	{/if}
	<div class="text">
		<header>
			<p class="kind overline">
				{#if subject.kind === 'era'}
					<span class="mark" aria-hidden="true">
						<Icon icon={eraIcon(subject.code)} size="sm" />
					</span>
				{/if}
				<MetaLine text={m.valuePage.header(valueKindName(subject.kind), m.atelier.count(count))} />
			</p>
			<h1>{title}</h1>
			{#if subject.kind === 'era'}
				<p class="years">
					{eraYearsText(subject.code)}
					<EraOutsideNote {artworks} code={subject.code} />
				</p>
			{/if}
			{#if author && (lifeYears || author.country)}
				<p class="author-line">
					<MetaLine parts={[lifeYears || null, author.country]} />
				</p>
			{/if}
			{#if place.some((part) => part !== null)}
				<p class="place">
					{#if details.location?.placeType}
						<Icon icon={placeTypeIcon(details.location.placeType)} size="sm" />
					{/if}
					<MetaLine parts={place} />
				</p>
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

		<VisitsDisclosure
			stub={(visit) =>
				visit.artworkIds.length > 0 ? m.chronicle.seen(visit.artworkIds.length) : ''}
			title={m.chronicle.placeVisits}
			{visits}
		/>

		{#if empty}
			<p class="empty">{m.valuePage.kinds[subject.kind].noNotes}</p>
		{:else}
			{#if details.summary}
				<Section>
					<p class="summary">{details.summary}</p>
				</Section>
			{/if}
			{#if details.notes}
				<NotesSection>
					<GlossaryNotes entries={glossary} links={noteLinks} value={details.notes} />
				</NotesSection>
			{/if}
		{/if}

		<MentionedIn {mentions} />
	</div>
</article>

<style>
	.years {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	article,
	header {
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
		position: relative;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.mat :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.kind {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.place {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
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
