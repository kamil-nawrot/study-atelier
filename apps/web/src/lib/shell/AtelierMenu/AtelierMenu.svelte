<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Footprints from '@lucide/svelte/icons/footprints';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Layers from '@lucide/svelte/icons/layers';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import LogOut from '@lucide/svelte/icons/log-out';
	import MessageSquarePlus from '@lucide/svelte/icons/message-square-plus';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Count, Icon } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Profile } from '#lib/profile/types/profile.ts';
	import Avatar from '#lib/profile/components/Avatar/Avatar.svelte';
	import {
		followMenuProfile,
		shownMenuProfile
	} from '#lib/profile/menu-profile/menu-profile.svelte.ts';
	import { avatarInitial } from '#lib/profile/profile/profile.ts';
	import { currentTheme, setTheme } from '#lib/shell/theme/theme.svelte.ts';

	type Props = {
		email: string;
		signingOut: boolean;
		compact?: boolean;
		onsignout: () => void;
		onfeedback: () => void;
	};

	let { email, signingOut, compact = false, onsignout, onfeedback }: Props = $props();

	const atelierPath = resolve('/(app)/atelier');
	const cardIndexPath = resolve('/(app)/atelier/values');
	const glossaryPath = resolve('/(app)/atelier/glossary');
	const timelinePath = resolve('/(app)/atelier/timeline');
	const chroniclePath = resolve('/(app)/atelier/chronicle');
	const trashPath = resolve('/(app)/atelier/trash');
	const settingsPath = resolve('/(app)/atelier/settings');
	const reviewPath = resolve('/(app)/atelier/review');
	const displayCasePath = resolve('/(app)/atelier/display-case');

	const light = $derived(currentTheme() === 'light');
	const ownerId = $derived(page.data.session?.user.id);

	$effect(() => followMenuProfile(page.data.menuProfile, ownerId));
</script>

{#snippet account(profile?: Profile)}
	<a
		class="item account"
		aria-current={page.url.pathname === settingsPath ? 'page' : undefined}
		aria-label={compact ? m.menu.settingsLink(profile?.displayName ?? email, email) : undefined}
		href={settingsPath}
	>
		<Avatar initial={avatarInitial(profile, email)} medium={!compact} path={profile?.avatarPath} />
		<span class="who" class:visually-hidden={compact}>
			{#if profile?.displayName}
				<span class="label">{profile.displayName}</span>
				<span class="label email" title={email}>{email}</span>
			{:else}
				<span class="label">{email}</span>
			{/if}
		</span>
	</a>
{/snippet}

<div class="group">
	<div class="account-group">
		{@render account(shownMenuProfile(ownerId))}
	</div>
	<a
		class="item"
		aria-current={page.url.pathname === atelierPath ? 'page' : undefined}
		href={atelierPath}
	>
		<Icon icon={ImagesIcon} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.atelier}
		</span>
	</a>
	<a
		class="item"
		aria-current={page.url.pathname === cardIndexPath ? 'page' : undefined}
		href={cardIndexPath}
	>
		<Icon icon={ListTree} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.cardIndex}
		</span>
	</a>
	<a
		class="item"
		aria-current={page.url.pathname.startsWith(glossaryPath) ? 'page' : undefined}
		href={glossaryPath}
	>
		<Icon icon={BookA} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.glossary}
		</span>
	</a>
	<a
		class="item"
		aria-current={page.url.pathname.startsWith(timelinePath) ? 'page' : undefined}
		href={timelinePath}
	>
		<Icon icon={CalendarRange} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.timeline}
		</span>
	</a>
	<a
		class="item"
		aria-current={page.url.pathname.startsWith(chroniclePath) ? 'page' : undefined}
		href={chroniclePath}
	>
		<Icon icon={Footprints} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.chronicle}
		</span>
	</a>
	<a
		class="item"
		aria-current={page.url.pathname === reviewPath ? 'page' : undefined}
		href={reviewPath}
	>
		<span class="icon">
			<Icon icon={Layers} />
			{#await page.data.reviewWaiting then waiting}
				{#if waiting > 0}
					<span class="badge" aria-hidden="true"></span>
				{/if}
			{/await}
		</span>
		<span class="label" class:visually-hidden={compact}>
			{m.menu.review}
			{#await page.data.reviewWaiting then waiting}
				{#if waiting > 0}
					<span class="visually-hidden">, {m.menu.reviewWaiting(waiting)}</span>
				{/if}
			{/await}
		</span>
		{#await page.data.reviewWaiting then waiting}
			{#if waiting > 0}
				<Count aria-hidden="true" value={waiting} />
			{/if}
		{/await}
	</a>
	<a
		class="item"
		aria-current={page.url.pathname === displayCasePath ? 'page' : undefined}
		href={displayCasePath}
	>
		<Icon icon={Landmark} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.displayCase}
		</span>
	</a>
</div>
<div class="group">
	<a
		class="item muted"
		aria-current={page.url.pathname === trashPath ? 'page' : undefined}
		href={trashPath}
	>
		<Icon icon={Trash} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.trash}
		</span>
	</a>
	<button class="item muted" onclick={onfeedback} type="button">
		<Icon icon={MessageSquarePlus} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.feedback}
		</span>
	</button>
	<button class="item muted" onclick={() => setTheme(light ? 'dark' : 'light')} type="button">
		<Icon icon={light ? Moon : Sun} />
		<span class="label" class:visually-hidden={compact}>
			{light ? m.menu.darkTheme : m.menu.lightTheme}
		</span>
	</button>
	<button class="item danger" disabled={signingOut} onclick={onsignout} type="button">
		<Icon icon={LogOut} />
		<span class="label" class:visually-hidden={compact}>
			{m.menu.signOut}
		</span>
	</button>
</div>

<style>
	.group {
		display: grid;
		gap: var(--spacing-1);
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-width: 0;
		padding: var(--spacing-2) var(--spacing-4) var(--spacing-2) var(--spacing-3);
		border: none;
		border-left: var(--border-width-button) solid transparent;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-align: left;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}

	a.item:hover,
	button.item:hover:not(:disabled) {
		background: var(--color-surface);
	}

	.account-group {
		margin-bottom: var(--spacing-2);
		padding-bottom: var(--spacing-2);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
	}

	.account {
		min-height: calc(40px + 2 * var(--spacing-2));
	}

	.item[aria-current='page'] {
		border-left-color: var(--color-fg);
	}

	.muted {
		color: var(--color-fg-muted);
	}

	.danger {
		color: var(--color-danger);
	}

	button.item:disabled {
		cursor: not-allowed;
	}

	.who {
		display: grid;
		min-width: 0;
	}

	.email {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.icon {
		position: relative;
		display: flex;
	}

	.badge {
		position: absolute;
		top: calc(-1 * var(--spacing-1));
		right: calc(-1 * var(--spacing-1));
		display: none;
		width: var(--spacing-2);
		height: var(--spacing-2);
		background: var(--color-fg);
	}
</style>
