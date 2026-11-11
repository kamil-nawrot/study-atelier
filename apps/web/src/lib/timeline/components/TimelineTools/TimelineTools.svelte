<script lang="ts">
	import { AddButton } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
</script>

<div class="actions">
	<AddButton href={resolve('/(app)/atelier/timeline/events/new')} label={m.timeline.add} />
</div>

<style>
	.actions {
		display: flex;
		gap: inherit;
		margin-inline-start: auto;
	}
</style>
