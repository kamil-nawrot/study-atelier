<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert } from '@study-atelier/ui';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import DisplayCase from '#lib/career/components/DisplayCase/DisplayCase.svelte';
	import EngravingCredits from '#lib/career/components/EngravingCredits/EngravingCredits.svelte';
	import RankProgress from '#lib/career/components/RankProgress/RankProgress.svelte';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { shownMenuProfile } from '#lib/profile/menu-profile/menu-profile.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	onMount(() => {
		if (!data.error) void career.markSeen();
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.career.title}>
	<header>
		<div class="title">
			<h1>{m.career.title}</h1>
			{#if !data.error}
				<EngravingCredits codes={data.exhibits.map((exhibit) => exhibit.code)} />
			{/if}
		</div>
		<p class="lead">{m.career.lead}</p>
	</header>

	{#if data.error}
		<Alert title={m.career.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else}
		{#if career.standing}
			<RankProgress
				form={shownMenuProfile(data.session.user.id)?.rankForm ?? 'masculine'}
				points={career.standing.points}
			/>
		{/if}
		<DisplayCase exhibits={data.exhibits} />
	{/if}
</AtelierLayout>

<style>
	header {
		display: grid;
		gap: var(--spacing-2);
	}

	.title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-4);
	}
</style>
