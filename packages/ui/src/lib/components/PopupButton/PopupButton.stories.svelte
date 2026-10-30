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

<Story name="Bare">
	<div style="position: relative; display: flex; gap: var(--spacing-1)">
		<PopupButton bare label="Tier I">
			{#snippet trigger()}
				<span
					style="inline-size: var(--spacing-3); block-size: var(--spacing-3); background: var(--color-fg)"
				></span>
			{/snippet}
			<p>A curiosity of the first tier.</p>
		</PopupButton>
		<PopupButton bare label="Tier II">
			{#snippet trigger()}
				<span
					style="inline-size: var(--spacing-3); block-size: var(--spacing-3); background: var(--color-fg)"
				></span>
			{/snippet}
			<p>A curiosity of the second tier.</p>
		</PopupButton>
	</div>
</Story>

<Story name="Hover and top">
	<div style="padding-top: var(--spacing-24)">
		<PopupButton hover label="Sources" placement="top">
			{#snippet trigger()}
				Sources
			{/snippet}
			<p>Opens on hover with a mouse, above its button.</p>
		</PopupButton>
	</div>
</Story>
