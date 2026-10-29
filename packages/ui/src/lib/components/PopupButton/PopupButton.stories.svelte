<script lang="ts" module>
	import Info from '@lucide/svelte/icons/info';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PopupButton from './PopupButton.svelte';
	import StepSelect from '../StepSelect/StepSelect.svelte';

	const { Story } = defineMeta({
		title: 'Components/PopupButton',
		component: PopupButton,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	<PopupButton label="Grouping: era" tooltip>
		{#snippet trigger()}
			Group
		{/snippet}
		<StepSelect
			label="Group by"
			size="lg"
			steps={[
				{ value: 'era', label: 'Era' },
				{ value: 'period', label: 'Period' },
				{ value: 'style', label: 'Style' }
			]}
			value="era"
		/>
	</PopupButton>
</Story>

<Story name="Stage">
	<div style="padding: var(--spacing-4); background: var(--color-stage-bg)">
		<PopupButton align="end" label="About the exhibit" stageIcon={Info}>
			<p>A description shown over an image.</p>
		</PopupButton>
	</div>
</Story>
