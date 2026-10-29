update public.profiles
  set review_quiz_kinds = array_remove(review_quiz_kinds, 'quiz_author')
  where 'quiz_author' = any (review_quiz_kinds)
    and cardinality(review_quiz_kinds) > 1;
