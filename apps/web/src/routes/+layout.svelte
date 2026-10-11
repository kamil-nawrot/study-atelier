<script lang="ts">
	import '@study-atelier/ui/styles.css';
	import { setUiMessages } from '@study-atelier/ui';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { SESSION_DEPENDENCY, watchSession } from '#lib/auth/session.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	setUiMessages(m.ui);

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
