-- Add unique constraint for answer upserts
ALTER TABLE assessment_answers 
ADD CONSTRAINT assessment_answers_attempt_question_unique 
UNIQUE (attempt_id, question_id);