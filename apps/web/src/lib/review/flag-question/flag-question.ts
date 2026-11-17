import type { FlagQuestion } from '#lib/backroom/types/flag-question.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

const quizTexts = m.review.quiz;

function artworkQuestion(step: ReviewItem): string {
	switch (step.mode) {
		case 'flashcard':
			return m.review.flashcard.question;
		case 'quiz_image':
			return `${quizTexts.imageQuestion.start} ${step.artwork.title}${quizTexts.imageQuestion.end}`;
		case 'quiz_title':
			return quizTexts.titleQuestion;
		case 'quiz_author':
			return quizTexts.authorQuestion;
		case 'quiz_style':
			return quizTexts.styleQuestion;
		case 'quiz_pin':
			return quizTexts.pinQuestion;
		case 'quiz_typed':
			return quizTexts.typedQuestion;
	}
}

function questionText(step: SessionStep): string {
	switch (step.mode) {
		case 'quiz_definition':
			return quizTexts.definitionQuestion;
		case 'quiz_symbol':
			return quizTexts.symbolQuestions[step.kind];
		case 'note_gap':
			return quizTexts.noteQuestion;
		case 'quiz_pair':
			return quizTexts.pairQuestion[step.kind](step.asked);
		case 'quiz_relation':
			return step.question === 'pupilFrom' || step.question === 'pupilTo'
				? quizTexts.pupilQuestions[step.question]
				: `${quizTexts.relationQuestions[step.question]} ${step.artwork.title}?`;
		case 'year':
			return m.review.year.question;
		case 'order':
			return m.review.order.question;
		case 'event_year':
			return m.review.event.questions[step.kind];
		default:
			return artworkQuestion(step);
	}
}

function quizOf(step: SessionStep): Quiz | undefined {
	return 'quiz' in step ? step.quiz : undefined;
}

export function flagQuestion(step: SessionStep, chosen?: number): FlagQuestion {
	const quiz = quizOf(step);
	const answer = quiz?.options[quiz.answer]?.label;
	const picked =
		quiz && chosen !== undefined && chosen !== quiz.answer
			? quiz.options[chosen]?.label
			: undefined;
	return {
		mode: step.mode,
		text: questionText(step),
		...(answer !== undefined ? { answer } : {}),
		...(picked !== undefined ? { picked } : {}),
		...(step.mode === 'note_gap' ? { note: step.artwork.number } : {})
	};
}
