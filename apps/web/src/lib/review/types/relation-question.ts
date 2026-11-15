import type { ArtworkRelationType } from '#lib/artwork-relations/types/artwork-relation-type.ts';
import type { PupilQuestion } from './pupil-question.ts';

export type RelationQuestion = Exclude<ArtworkRelationType, 'related'> | PupilQuestion;
