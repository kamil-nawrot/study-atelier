<script lang="ts">
	import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
	import { Alert, Button } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { compareHref, swapped } from '#lib/compare/compare-address/compare-address.ts';
	import ComparisonView from '#lib/compare/components/ComparisonView/ComparisonView.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let both = $derived(data.left !== undefined && data.right !== undefined);
	let backNumber = $derived(data.sides.left ?? data.sides.right);
	let backHref = $derived(
		backNumber === null
			? resolve('/(app)/atelier')
			: resolve('/(app)/atelier/[number]', { number: String(backNumber) })
	);

	function swap(): void {
		void goto(compareHref(swapped(data.sides)) as ResolvedPathname, { replaceState: true });
	}
</script>

<AtelierLayout email={data.session.user.email ?? ''} fill title={m.compare.title}>
	{#snippet bar()}
		<BackLink fallbackHref={backHref} fallbackName={m.artworkView.back} />
		{#if both}
			<Button aria-label={m.compare.swap} compact icon={ArrowLeftRight} onclick={swap}>
				{m.compare.swap}
			</Button>
		{/if}
	{/snippet}

	{#if data.error}
		<Alert title={m.compare.loadFailedTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		<ComparisonView left={data.left} right={data.right} sides={data.sides} />
	{/if}
</AtelierLayout>
