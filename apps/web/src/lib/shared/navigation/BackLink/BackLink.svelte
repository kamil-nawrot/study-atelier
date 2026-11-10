<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { MediaQuery } from 'svelte/reactivity';
	import { Icon } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { goBackThroughHistory } from '#lib/shared/navigation/history/history.ts';
	import { currentBackPlace } from '#lib/shared/navigation/back/back.svelte.ts';

	type Props = {
		fallbackName: string;
		fallbackHref: ResolvedPathname;
		arrowOnly?: boolean;
	};

	let { fallbackName, fallbackHref, arrowOnly = false }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	let place = $derived(currentBackPlace());
	let href = $derived<ResolvedPathname>(
		(place?.path as ResolvedPathname | undefined) ?? fallbackHref
	);
</script>

<a
	class="back"
	class:arrow-only={arrowOnly}
	{href}
	onclick={(event) => goBackThroughHistory(event, place !== undefined, place?.steps)}
>
	<Icon icon={ArrowLeft} />
	<span class="name" class:visually-hidden={arrowOnly || !wide.current}
		>{place?.name ?? fallbackName}</span
	>
</a>

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.arrow-only {
		flex: none;
	}

	.name {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
