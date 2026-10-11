<script lang="ts">
	import '@study-atelier/ui/styles.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { SESSION_DEPENDENCY, watchSession } from '#lib/auth/session.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(() =>
		watchSession(
			() => data.session,
			() => invalidate(SESSION_DEPENDENCY)
		)
	);
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

{@render children()}
