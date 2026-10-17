import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/index.ts';
import { sendFeedback } from '../feedback-data.ts';
import FeedbackDialog from './FeedbackDialog.svelte';

vi.mock('../feedback-data.ts', () => ({ sendFeedback: vi.fn() }));

const send = vi.mocked(sendFeedback);

function renderDialog(): { onsent: ReturnType<typeof vi.fn> } {
	const onsent = vi.fn();
	render(FeedbackDialog, { open: true, onsent });
	return { onsent };
}

function sendButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.feedback.send, exact: true });
}

describe('FeedbackDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks for the kind and the title before sending', async () => {
		const { onsent } = renderDialog();

		await userEvent.click(sendButton());

		await expect.element(page.getByText(m.feedback.errors.kindRequired)).toBeInTheDocument();
		await expect.element(page.getByText(m.feedback.errors.titleRequired)).toBeInTheDocument();
		expect(send).not.toHaveBeenCalled();
		expect(onsent).not.toHaveBeenCalled();
	});

	it('sends the report, closes and tells the parent', async () => {
		send.mockResolvedValue({});
		const { onsent } = renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.feedback.idea }));
		await userEvent.type(page.getByLabelText(m.feedback.titleLabel), 'Dark mode for notes');
		await userEvent.type(page.getByLabelText(m.feedback.descriptionLabel), 'It is too bright.');
		await userEvent.click(sendButton());

		await vi.waitFor(() => expect(onsent).toHaveBeenCalledOnce());
		expect(send).toHaveBeenCalledWith({
			kind: 'idea',
			title: 'Dark mode for notes',
			description: 'It is too bright.'
		});
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('keeps the text and shows an alert when sending fails', async () => {
		send.mockResolvedValue({ error: m.feedback.errors.network });
		const { onsent } = renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.feedback.bug }));
		await userEvent.type(page.getByLabelText(m.feedback.titleLabel), 'Broken filter');
		await userEvent.click(sendButton());

		await expect.element(page.getByText(m.feedback.errorTitle)).toBeInTheDocument();
		await expect.element(page.getByText(m.feedback.errors.network)).toBeInTheDocument();
		await expect.element(page.getByLabelText(m.feedback.titleLabel)).toHaveValue('Broken filter');
		expect(onsent).not.toHaveBeenCalled();
	});
});
