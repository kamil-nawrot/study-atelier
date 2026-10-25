<script lang="ts">
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Plus from '@lucide/svelte/icons/plus';
	import { Button, EmptyState, Icon } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
</script>

<EmptyState icon={CalendarRange} text={m.timeline.empty} title={m.timeline.emptyTitle}>
	<Button href={resolve('/(app)/atelier/timeline/events/new')}>
		<Icon icon={Plus} />
		{m.timeline.addFirst}
	</Button>
</EmptyState>
