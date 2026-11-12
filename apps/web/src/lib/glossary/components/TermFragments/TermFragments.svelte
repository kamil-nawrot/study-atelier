<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import LensStrip from '#lib/pins/components/LensStrip/LensStrip.svelte';
	import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		fragments: readonly TermFragment[];
	};

	let { fragments }: Props = $props();
</script>

<section aria-labelledby="glossary-fragments">
	<Disclosure
		id="glossary-fragments"
		count={fragments.length}
		room
		title={m.glossary.view.fragments}
	>
		<div class="fragments">
			<LensStrip
				backLabel={m.glossary.view.fragmentsBack}
				count={fragments.length}
				forwardLabel={m.glossary.view.fragmentsForward}
			>
				{#each fragments as fragment (fragment.pinId)}
					<li>
						<a
							href="{resolve('/(app)/atelier/[number]', {
								number: String(fragment.number)
							})}?pin={encodeURIComponent(fragment.pinId)}"
							title={fragment.text || undefined}
						>
							<DetailLens lens={fragment} />
							<span class="title">{fragment.title}</span>
							<span class="number">{formatRecordNumber(fragment.number)}</span>
						</a>
					</li>
				{/each}
			</LensStrip>
		</div>
	</Disclosure>
</section>

<style>
	.fragments {
		--detail-lens: 128px;
	}

	a {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
		color: var(--color-fg);
		text-align: center;
		text-decoration: none;
	}

	a:hover,
	a:focus-visible {
		--detail-lens-ring: var(--color-fg-muted);
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-md);
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
	}

	@media (min-width: 768px) {
		.fragments {
			--detail-lens: 160px;
		}
	}
</style>
