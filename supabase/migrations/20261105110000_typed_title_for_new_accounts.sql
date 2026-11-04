update public.profiles
  set review_quiz_kinds = array_remove(review_quiz_kinds, 'quiz_typed')
  where 'quiz_typed' = any (review_quiz_kinds)
    and cardinality(review_quiz_kinds) > 1;
