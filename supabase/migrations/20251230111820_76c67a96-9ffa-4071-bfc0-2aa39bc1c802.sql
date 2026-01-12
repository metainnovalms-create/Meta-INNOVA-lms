-- Delete inventory-related notifications incorrectly sent to students
DELETE FROM public.notifications 
WHERE type IN ('purchase_request', 'inventory_issue')
AND recipient_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'student'
);