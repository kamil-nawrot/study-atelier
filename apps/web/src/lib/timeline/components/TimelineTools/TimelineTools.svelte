<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
</script>

<div class="actions">
	<Button href={resolve('/(app)/atelier/timeline/events/new')} variant="primary">
		<Icon icon={Plus} size="sm" />
		<span class="long">{m.timeline.add}</span>
		<span class="short">{m.common.add}</span>
	</Button>
</div>

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}

	.short {
		display: inline;
	}

	.long {
		display: none;
	}

	@media (min-width: 768px) {
		.short {
			display: none;
		}

		.long {
			display: inline;
		}
	}
</style>
