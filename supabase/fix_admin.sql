
-- IMPORTANT: You cannot INSERT directly into 'profiles' without a corresponding user in 'auth.users'.
-- Instead, you must sign up in the application first, then run this script to promote that user.

-- Replace 'your-email@example.com' with the email you signed up with.

UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'admin@smlghana.store'; -- Change this to your email

-- Verify the update
SELECT email, role, full_name FROM public.profiles WHERE role = 'ADMIN';
