<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { LucideIcon } from '@lucide/svelte';
	import { Icon, type NoteLinks, Popover, Tag, overlayScrollbar } from '@study-atelier/ui';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import ValueSummaryCard from '#lib/card-index/components/ValueSummaryCard/ValueSummaryCard.svelte';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { ValueKind } from '#lib/card-index/types/value-kind.ts';
	import type { ValueSummaries } from '#lib/card-index/types/value-summaries.ts';
	import type { ValueSummary } from '#lib/card-index/types/value-summary.ts';
	import { valueKindName } from '#lib/card-index/value-pages/value-pages.ts';
	import { summaryKey } from '#lib/card-index/value-summaries/value-summaries.ts';
	import { artworkTypeIcon } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { eraIcon } from '#lib/catalogue/eras/eras.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { formatDate, signedYear } from '#lib/catalogue/years/years.ts';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import ArtworkVisits from '#lib/chronicle/components/ArtworkVisits/ArtworkVisits.svelte';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import MentionedIn from '#lib/notes/components/MentionedIn/MentionedIn.svelte';
	import type { Mention } from '#lib/notes/types/mention.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: ArtworkRecord;
		noteLinks?: NoteLinks;
		glossary?: GlossaryEntry[];
		mentions: Mention[];
		visits: Visit[];
		summaries: ValueSummaries;
		ownFields: OwnFieldDefinition[];
		closed: boolean;
		onhide: () => void;
	};

	let {
		artwork,
		noteLinks,
		glossary,
		mentions,
		visits,
		summaries,
		ownFields,
		closed,
		onhide
	}: Props = $props();

	type ViewField = {
		label: string;
		values: string[];
		tags: boolean;
		kind?: ValueKind;
		icon?: LucideIcon;
	};

	let authors = $derived(
		artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor
	);
	let date = $derived(
		formatDate(
			signedYear(artwork.yearFrom, artwork.fromBeforeCommonEra),
			signedYear(artwork.yearTo, artwork.toBeforeCommonEra),
			artwork.yearApproximate
		)
	);

	let fields = $derived<ViewField[]>([
		{
			label: m.artworkForm.type,
			values: artwork.typeCode ? [m.artworkTypes[artwork.typeCode]] : [],
			tags: false,
			icon: artwork.typeCode ? artworkTypeIcon(artwork.typeCode) : undefined
		},
		{
			label: m.artworkForm.era,
			values: artwork.eraCode ? [m.eras[artwork.eraCode].name] : [],
			tags: false,
			kind: 'era',
			icon: artwork.eraCode ? eraIcon(artwork.eraCode) : undefined
		},
		{
			label: m.artworkForm.period,
			values: artwork.period ? [artwork.period] : [],
			tags: true,
			kind: 'period'
		},
		{ label: m.artworkForm.style, values: artwork.styles, tags: true, kind: 'style' },
		{ label: m.artworkForm.material, values: artwork.materials, tags: true, kind: 'material' },
		{
			label: m.artworkForm.location,
			values: artwork.location ? [artwork.location] : [],
			tags: true,
			kind: 'location'
		},
		...ownFields.flatMap((field) => {
			const entry = artwork.own?.[field.id];
			if (Array.isArray(entry)) {
				return entry.length > 0 ? [{ label: field.name, values: entry, tags: true }] : [];
			}
			const text = entry === true ? m.ownFields.ticked : (entry || '').trim();
			return text ? [{ label: field.name, values: [text], tags: false }] : [];
		})
	]);

	function summaryOf(kind: ValueKind, name: string): ValueSummary | undefined {
		if (kind === 'era') return artwork.eraCode ? summaries.eras[artwork.eraCode] : undefined;
		return summaries.values[summaryKey(kind, name)];
	}

	function parentOf(kind: ValueKind): string | undefined {
		if (kind === 'period' && artwork.eraCode) return m.eras[artwork.eraCode].name;
		if (kind === 'style' && artwork.period) return artwork.period;
		return undefined;
	}
</script>

{#snippet valueName(kind: ValueKind, name: string)}
	{@const summary = summaryOf(kind, name)}
	{#if summary}
		<Popover>
			{name}
			{#snippet content()}
				<ValueSummaryCard {name} kind={valueKindName(kind)} parent={parentOf(kind)} {summary} />
			{/snippet}
		</Popover>
	{:else}
		{name}
	{/if}
{/snippet}

{#snippet valueTag(kind: ValueKind | undefined, name: string)}
	{@const summary = kind ? summaryOf(kind, name) : undefined}
	{@const label =
		kind === 'location' && summaries.countries[name]
			? `${name}, ${summaries.countries[name]}`
			: name}
	{#if kind && summary}
		<Popover>
			<Tag>{label}</Tag>
			{#snippet content()}
				<ValueSummaryCard {name} kind={valueKindName(kind)} parent={parentOf(kind)} {summary} />
			{/snippet}
		</Popover>
	{:else}
		<Tag>{label}</Tag>
	{/if}
{/snippet}

{#snippet empty()}
	<span class="empty">
		<span aria-hidden="true">—</span>
		<span class="visually-hidden">{m.artworkView.empty}</span>
	</span>
{/snippet}

<aside
	class="panel"
	class:closed
	{@attach overlayScrollbar()}
	aria-label={m.artworkView.information}
>
	<div class="panel-top">
		<span class="caption">{m.artworkView.information}</span>
		<button
			class="icon-button"
			aria-label={m.artworkView.hideInformation}
			onclick={onhide}
			type="button"
		>
			<Icon icon={X} />
		</button>
	</div>

	<header class="heading">
		<span class="number">{formatRecordNumber(artwork.number)}</span>
		<h1><cite class="artwork-title">{artwork.title}</cite></h1>
		<p class="meta">
			<span>
				{#if artwork.authors.length === 0}
					{authors}
				{:else}
					{#each artwork.authors as author, index (author)}
						{index > 0 ? ', ' : ''}{@render valueName('author', author)}
					{/each}
				{/if}
			</span>
			{#if date}
				<span aria-hidden="true">·</span>
				<span class="date">{date}</span>
			{/if}
		</p>
	</header>

	<dl>
		{#each fields as field (field.label)}
			<dt class="caption">{field.label}</dt>
			<dd>
				{#if field.values.length === 0}
					{@render empty()}
				{:else if field.tags}
					{#each field.values as value (value)}
						{@render valueTag(field.kind, value)}
					{/each}
				{:else}
					{#if field.icon}
						<Icon icon={field.icon} size="sm" />
					{/if}
					{#each field.values as value (value)}
						{#if field.kind}
							{@render valueName(field.kind, value)}
						{:else}
							{value}
						{/if}
					{/each}
				{/if}
			</dd>
		{/each}
	</dl>

	<ArtworkVisits {visits} />

	<section class="notes" aria-labelledby="artwork-notes">
		<h2 id="artwork-notes" class="caption">{m.common.notes}</h2>
		{#if artwork.notes.trim()}
			<GlossaryNotes entries={glossary} links={noteLinks} value={artwork.notes} />
		{:else}
			{@render empty()}
		{/if}
	</section>

	<MentionedIn {mentions} />
</aside>

<style>
	.panel {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
		padding: var(--spacing-6) var(--spacing-4) var(--spacing-12);
	}

	.panel-top {
		display: none;
	}

	.icon-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.heading {
		display: grid;
		gap: var(--spacing-2);
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		font-variant-numeric: tabular-nums;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--spacing-1);
	}

	.date {
		white-space: nowrap;
	}

	dl {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--spacing-3) var(--spacing-4);
	}

	dt,
	dd {
		min-height: calc(var(--font-size-sm) * var(--line-height-xs) + 2 * var(--spacing-1));
	}

	dt {
		display: flex;
		align-items: center;
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.notes {
		display: grid;
		gap: var(--spacing-2);
	}

	.notes h2 {
		font-weight: var(--font-weight-regular);
	}

	.empty {
		color: var(--color-fg-muted);
	}

	@media (max-width: 767.98px) {
		.heading {
			align-content: start;
			min-height: var(--heading-height);
		}
	}

	@media (min-width: 768px) {
		.panel {
			width: 380px;
			height: 100%;
			overflow-y: auto;
			padding: var(--spacing-8) var(--spacing-6) var(--spacing-12);
		}

		.panel-top {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-right: calc(-1 * var(--spacing-2));
		}

		.panel.closed {
			visibility: hidden;
		}
	}

	@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
		.panel {
			transition:
				visibility var(--duration-short),
				opacity var(--duration-short) ease-out;
		}
	}
</style>
