import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, /^(Autorem|Styl) którego z tych dzieł/);
}
