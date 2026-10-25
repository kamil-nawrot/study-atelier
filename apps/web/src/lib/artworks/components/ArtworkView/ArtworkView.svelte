<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { Icon, type NoteLinks } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import ArtworkInfo from '#lib/artworks/components/ArtworkInfo/ArtworkInfo.svelte';
	import ArtworkStage from '#lib/artworks/components/ArtworkStage/ArtworkStage.svelte';
	import {
		artworkPanelOpen,
		rememberArtworkPanel
	} from '#lib/artworks/artwork-panel/artwork-panel.ts';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
	import type { ValueSummaries } from '#lib/card-index/types/value-summaries.ts';
	import { emptyValueSummaries } from '#lib/card-index/value-summaries/value-summaries.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import type { Mention } from '#lib/notes/types/mention.ts';
	import type { Visit } from '#lib/chronicle/types/visit.ts';
	import type { Pin as PinRecord } from '#lib/pins/types/pin.ts';
	import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: ArtworkRecord;
		editHref: string;
		noteLinks?: NoteLinks;
		glossary?: GlossaryEntry[];
		pins?: PinRecord[];
		focusPin?: string;
		mentions?: Mention[];
		visits?: Visit[];
		summaries?: ValueSummaries;
		ownFields?: OwnFieldDefinition[];
		showPinsOnOpen?: boolean;
		loupeOnOpen?: boolean;
		flipLinks?: Record<FlipDirection, ResolvedPathname | null>;
		onflip?: (direction: FlipDirection) => void;
	};

	let {
		artwork,
		editHref,
		flipLinks,
		noteLinks,
		glossary,
		pins = [],
		focusPin,
		mentions = [],
		visits = [],
		summaries = emptyValueSummaries(),
		ownFields = [],
		showPinsOnOpen = false,
		loupeOnOpen = false,
		onflip
	}: Props = $props();

	let panelOpen = $state(artworkPanelOpen());

	function setPanel(open: boolean): void {
		panelOpen = open;
		rememberArtworkPanel(open);
	}
</script>

<div class="view" class:closed={!panelOpen}>
	<ArtworkStage
		{artwork}
		{editHref}
		{flipLinks}
		{focusPin}
		{glossary}
		{loupeOnOpen}
		{onflip}
		{pins}
		{showPinsOnOpen}
	/>

	<div class="side">
		<ArtworkInfo
			{artwork}
			closed={!panelOpen}
			{glossary}
			{mentions}
			{noteLinks}
			onhide={() => setPanel(false)}
			{ownFields}
			{summaries}
			{visits}
		/>

		<div class="strip">
			<button
				class="icon-button"
				aria-expanded="false"
				aria-label={m.artworkView.showInformation}
				onclick={() => setPanel(true)}
				type="button"
			>
				<Icon icon={ChevronLeft} />
				<span class="strip-label">{m.artworkView.information}</span>
			</button>
		</div>
	</div>
</div>

<style>
	.view {
		display: grid;
	}

	.strip {
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

	@media (max-width: 767.98px) {
		.view {
			--heading-height: calc(
				var(--font-size-xs) * var(--line-height-xs) + 2 * var(--spacing-2) + 2 *
					var(--font-size-xl) * var(--line-height-xl) + var(--font-size-md) * var(--line-height-md)
			);
		}
	}

	@media (min-width: 768px) {
		.view {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: minmax(0, 1fr);
			height: 100%;
			min-height: 0;
		}

		.side {
			position: relative;
			box-sizing: content-box;
			width: 380px;
			overflow: hidden;
			border-left: var(--border-width-hairline) solid var(--color-tag);
		}

		.closed .side {
			width: 48px;
		}

		.strip {
			position: absolute;
			inset: 0 auto 0 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 48px;
			padding: var(--spacing-8) 0 var(--spacing-4);
			background: var(--color-bg);
			visibility: hidden;
			opacity: 0;
		}

		.closed .strip {
			visibility: visible;
			opacity: 1;
		}

		.strip .icon-button {
			flex-direction: column;
			gap: var(--spacing-3);
		}

		.strip-label {
			writing-mode: vertical-rl;
			font-size: var(--font-size-sm);
			font-weight: var(--font-weight-medium);
			line-height: var(--line-height-sm);
		}
	}

	@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
		.side {
			transition: width var(--duration-short) ease-out;
		}

		.strip {
			transition:
				visibility var(--duration-short),
				opacity var(--duration-short) ease-out;
		}
	}
</style>
