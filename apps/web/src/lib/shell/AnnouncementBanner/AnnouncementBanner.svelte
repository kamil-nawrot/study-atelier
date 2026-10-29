<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert, TextButton } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { currentAnnouncements } from '#lib/shell/announcements-data/announcements-data.ts';
	import {
		dismissAnnouncement,
		dismissedAnnouncements,
		visibleAnnouncements,
		type Announcement
	} from '#lib/shell/announcements/announcements.ts';

	let announcements = $state<Announcement[]>([]);

	onMount(async () => {
		announcements = visibleAnnouncements(await currentAnnouncements(), dismissedAnnouncements());
	});

	function dismiss(id: string): void {
		dismissAnnouncement(id);
		announcements = announcements.filter((announcement) => announcement.id !== id);
	}
</script>

{#if announcements.length > 0}
	<div class="announcements">
		{#each announcements as announcement (announcement.id)}
			<div class="announcement">
				<Alert label={m.announcements.label} title={announcement.title ?? undefined} tone="warning">
					{announcement.body}
				</Alert>
				<TextButton
					aria-label={m.announcements.dismissLabel}
					onclick={() => dismiss(announcement.id)}
				>
					{m.announcements.dismiss}
				</TextButton>
			</div>
		{/each}
	</div>
{/if}

<style>
	.announcements {
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4) var(--wall-inline) 0;
	}

	.announcement {
		display: grid;
		justify-items: end;
		gap: var(--spacing-1);
	}

	.announcement > :global(:first-child) {
		justify-self: stretch;
	}
</style>
