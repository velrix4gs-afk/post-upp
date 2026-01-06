-- Add DELETE policy for notifications table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    TO public
    USING (user_id = auth.uid());
  END IF;
END $$;