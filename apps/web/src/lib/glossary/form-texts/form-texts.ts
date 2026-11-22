import { m } from '#lib/i18n/i18n.ts';

export function glossaryFormTexts(figure: boolean): typeof m.glossary.form {
	return figure ? { ...m.glossary.form, ...m.glossary.form.figure } : m.glossary.form;
}
