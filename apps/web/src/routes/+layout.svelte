<script lang="ts">
	import { PageScrollbar, setUiMessages } from '@study-atelier/ui';
	import { onMount } from 'svelte';
	import { afterNavigate, beforeNavigate, invalidate, onNavigate, snapshot } from '$app/navigation';
	import { updated } from '$app/state';
	import appleTouchIcon from '#lib/assets/apple-touch-icon.png';
	import faviconPng from '#lib/assets/favicon-32.png';
	import favicon from '#lib/assets/favicon.svg';
	import { SESSION_DEPENDENCY, watchSession } from '#lib/auth/session-data/session-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { identifyLearner } from '#lib/shared/monitoring/monitoring.ts';
	import {
		currentBackPlace,
		forgetRestoredBackPlace,
		recordArrival,
		setBackPlace
	} from '#lib/shared/navigation/back/back.svelte.ts';
	import { loadNewVersion } from '#lib/shell/new-version/new-version.ts';
	import { hideLoadingScreen } from '#lib/startup/loading-screen/loading-screen.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	setUiMessages(m.ui);

	beforeNavigate(forgetRestoredBackPlace);
	afterNavigate(recordArrival);
	onNavigate((navigation) => loadNewVersion(navigation, updated.current));
	snapshot({ id: 'back-place', capture: currentBackPlace, restore: setBackPlace });

	$effect(() => identifyLearner(data.session?.user.id));

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

<PageScrollbar />

{@render children()}
