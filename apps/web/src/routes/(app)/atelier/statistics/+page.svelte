<script lang="ts">
	import { LoadFailure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import BackLink from '#lib/shared/navigation/BackLink/BackLink.svelte';
	import StatisticsView from '#lib/statistics/components/StatisticsView/StatisticsView.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const atelierPath = resolve('/(app)/atelier');
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.statistics.title}>
	{#snippet bar()}
		<BackLink fallbackHref={atelierPath} fallbackName={m.statistics.back} />
	{/snippet}

	{#if data.statistics && !data.error}
		<StatisticsView artworks={data.artworks} statistics={data.statistics} />
	{:else}
		<LoadFailure
			backHref={atelierPath}
			backLabel={m.statistics.back}
			heading={m.statistics.title}
			message={data.error ?? m.statistics.loadError}
			notFound={false}
		/>
	{/if}
</AtelierLayout>
