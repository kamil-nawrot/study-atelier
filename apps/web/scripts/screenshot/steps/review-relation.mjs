import { reachQuestion } from './review-until.mjs';

const QUESTIONS =
	/^(Do jakiego dzieła|Które dzieło|Kopią|Częścią|Kto był|Kto wywarł|Czyja twórczość|Kto należy)/;

export default async function (page) {
	await reachQuestion(page, QUESTIONS);
}
