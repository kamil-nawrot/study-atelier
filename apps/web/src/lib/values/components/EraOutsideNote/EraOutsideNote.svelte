<script lang="ts">
	import { yearOutsideEra } from '#lib/catalogue/eras/eras.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { outsideEraHref } from '#lib/values/era-bounds-form/era-bounds-form.ts';
	import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		subject: ValueSubject;
		artworks: WallArtwork[];
	};

	let { subject, artworks }: Props = $props();

	let outside = $derived(
		subject.kind === 'era'
			? {
					count: artworks.filter((artwork) => yearOutsideEra(artwork)).length,
					href: outsideEraHref(subject.code)
				}
			: undefined
	);
</script>

{#if outside && outside.count > 0}
	<p class="note">
		{m.eraBounds.outside(outside.count)}
		<a href={outside.href}>{m.eraBounds.showOutside}</a>
	</p>
{/if}

<style>
	.note {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	a {
		color: var(--color-fg);
	}
</style>
