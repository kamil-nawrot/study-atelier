<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
	import type { Snippet } from 'svelte';
	import { Icon, ProgressLine, Toast } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page, updated } from '$app/state';
	import { signOut } from '#lib/auth/account-data/account-data.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { nameCurrentPlace } from '#lib/shared/navigation/back/back.svelte.ts';
	import FeedbackDialog from '#lib/feedback/components/FeedbackDialog/FeedbackDialog.svelte';
	import LegalUpdateDialog from '#lib/legal/components/LegalUpdateDialog/LegalUpdateDialog.svelte';
	import AtelierDrawer from '#lib/shell/AtelierDrawer/AtelierDrawer.svelte';
	import AnnouncementBanner from '#lib/shell/AnnouncementBanner/AnnouncementBanner.svelte';
	import AtelierRail from '#lib/shell/AtelierRail/AtelierRail.svelte';
	import NewMark from '#lib/career/components/NewMark/NewMark.svelte';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';
	import NewVersionNotice from '#lib/shell/NewVersionNotice/NewVersionNotice.svelte';

	type Props = {
		title: string;
		email: string;
		bar?: Snippet;
		strip?: Snippet;
		panel?: Snippet;
		children: Snippet;
		confirmLeave?: () => Promise<boolean>;
		fill?: boolean;
		barHeight?: number;
	};

	let {
		title,
		email,
		bar,
		strip,
		panel,
		children,
		confirmLeave,
		fill = false,
		barHeight = $bindable(0)
	}: Props = $props();

	$effect(() => {
		nameCurrentPlace(title);
	});

	let signingOut = $state(false);
	let drawer: ReturnType<typeof AtelierDrawer>;
	let feedbackOpen = $state(false);
	let feedbackUsed = $state(false);
	let toast = $state<Toast>();

	function openFeedback(): void {
		drawer.close();
		feedbackUsed = true;
		feedbackOpen = true;
	}

	async function submitSignOut(): Promise<void> {
		drawer.close();
		if (confirmLeave && !(await confirmLeave())) return;
		signingOut = true;
		await signOut();
		await goto(resolve('/(auth)/sign-in'), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.app.pageTitle(title)}</title>
</svelte:head>

<div style:--bar-height="{barHeight}px" class="atelier" class:fill>
	<AtelierRail {email} onfeedback={openFeedback} onsignout={submitSignOut} {signingOut} />

	<div class="main">
		<header class="bar" bind:offsetHeight={barHeight}>
			<button
				class="burger"
				aria-haspopup="dialog"
				aria-label={m.menu.open}
				onclick={() => drawer.open()}
				type="button"
			>
				<Icon icon={Menu} />
				{#if page.data.careerShown !== false}
					<NewMark
						flash={career.tierFlash + career.rankFlash}
						shown={career.hasNewTiers || career.hasNewRank}
					/>
				{/if}
			</button>
			{@render bar?.()}
			{#if navigating.to}
				<ProgressLine />
			{/if}
		</header>
		<AnnouncementBanner />
		{@render strip?.()}
		<div class="body">
			<main class="content" aria-busy={navigating.to !== null}>
				{@render children()}
			</main>
			{@render panel?.()}
		</div>
	</div>

	<AtelierDrawer
		bind:this={drawer}
		{email}
		onfeedback={openFeedback}
		onsignout={submitSignOut}
		{signingOut}
	/>

	{#if feedbackUsed}
		<FeedbackDialog onsent={() => toast?.show(m.feedback.sent)} bind:open={feedbackOpen} />
		<Toast bind:this={toast} />
	{/if}

	<LegalUpdateDialog accepted={page.data.acceptedLegalVersion} />
	<NewVersionNotice updated={updated.current} />
</div>

<style>
	.atelier {
		--page-inline: var(--spacing-4);
		--filter-panel-width: 380px;
		--artwork-max-height: calc(100dvh - var(--bar-height));
		display: flex;
		min-height: 100dvh;
	}

	.main {
		--panel-width: 0px;
		--wall-inline: max(
			var(--page-inline),
			calc((100% - var(--panel-width) - var(--size-content-wide)) / 2)
		);
		flex: 1;
		min-width: 0;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		box-sizing: content-box;
		align-items: stretch;
		gap: var(--spacing-2);
		height: var(--size-control);
		padding: var(--spacing-3) var(--page-inline);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.burger {
		position: relative;
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.body {
		display: flex;
		align-items: flex-start;
	}

	.content {
		display: grid;
		flex: 1;
		min-width: 0;
		gap: var(--spacing-6);
		padding: var(--spacing-6) var(--wall-inline) var(--spacing-12);
	}

	.fill .content {
		gap: 0;
		padding: 0;
	}

	.main:has(> .body > :global(.filter-panel.open)) {
		--panel-width: var(--filter-panel-width);
	}

	@media (prefers-reduced-motion: no-preference) {
		.content {
			transition: padding var(--duration-short) ease-out;
		}
	}

	@media (min-width: 768px) {
		.atelier {
			--page-inline: var(--spacing-6);
			--artwork-max-height: 100000px;
		}

		.burger {
			display: none;
		}

		.bar {
			gap: var(--spacing-3);
			padding: var(--spacing-4) var(--page-inline);
		}

		.content {
			padding: var(--spacing-8) var(--wall-inline) var(--spacing-12);
		}

		.content :global(header > .lead) {
			max-width: 50%;
		}

		.fill .main {
			display: flex;
			flex-direction: column;
			height: 100dvh;
		}

		.fill .body {
			flex: 1;
			min-height: 0;
		}

		.fill .content {
			align-self: stretch;
			min-height: 0;
			padding: 0;
		}
	}
</style>
