<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { Icon, Tooltip } from '@study-atelier/ui';
	import { yearOutsideEra } from '#lib/catalogue/eras/eras.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { outsideEraHref } from '#lib/values/era-bounds-form/era-bounds-form.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		code: EraCode;
		artworks: WallArtwork[];
	};

	let { code, artworks }: Props = $props();

	let count = $derived(artworks.filter((artwork) => yearOutsideEra(artwork)).length);
	let text = $derived(m.eraBounds.outside(count));
	let href = $derived(outsideEraHref(code));
</script>

{#if count > 0}
	<Tooltip placement="bottom" {text}>
		<a class="warning" aria-label={text} {href}>
			<Icon icon={CircleAlert} size="sm" />
		</a>
	</Tooltip>
{/if}

<style>
	.warning {
		display: inline-flex;
		color: var(--color-danger);
	}
</style>
