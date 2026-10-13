<script lang="ts">
	import { setUiMessages } from '@study-atelier/ui';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import appleTouchIcon from '#lib/assets/apple-touch-icon.png';
	import faviconPng from '#lib/assets/favicon-32.png';
	import favicon from '#lib/assets/favicon.svg';
	import { SESSION_DEPENDENCY, watchSession } from '#lib/auth/session.ts';
	import { m } from '#lib/i18n/index.ts';
	import { hideLoadingScreen } from '#lib/startup/loading-screen.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	setUiMessages(m.ui);

	onMount(() => {
		hideLoadingScreen();
		return watchSession(
			() => data.session,
			() => invalidate(SESSION_DEPENDENCY)
		);
	});
</script>

<svelte:head>
	<link href={faviconPng} rel="icon" sizes="32x32" type="image/png" />
	<link href={favicon} rel="icon" type="image/svg+xml" />
	<link href={appleTouchIcon} rel="apple-touch-icon" />
</svelte:head>

{@render children()}
