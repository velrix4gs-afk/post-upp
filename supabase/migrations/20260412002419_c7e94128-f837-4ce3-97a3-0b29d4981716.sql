
-- Step 1: Delete duplicate private chats, keeping only the most recent one per user pair
WITH private_chat_pairs AS (
  SELECT 
    cp1.chat_id,
    LEAST(cp1.user_id, cp2.user_id) AS user_a,
    GREATEST(cp1.user_id, cp2.user_id) AS user_b,
    ROW_NUMBER() OVER (
      PARTITION BY LEAST(cp1.user_id, cp2.user_id), GREATEST(cp1.user_id, cp2.user_id)
      ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC NULLS LAST
    ) AS rn
  FROM chat_participants cp1
  JOIN chat_participants cp2 
    ON cp1.chat_id = cp2.chat_id AND cp1.user_id < cp2.user_id
  JOIN chats c 
    ON c.id = cp1.chat_id AND c.type = 'private'
),
duplicates AS (
  SELECT chat_id FROM private_chat_pairs WHERE rn > 1
)
DELETE FROM chats WHERE id IN (SELECT chat_id FROM duplicates);

-- Step 2: Create find_private_chat RPC function
CREATE OR REPLACE FUNCTION public.find_private_chat(p_user_a uuid, p_user_b uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT cp1.chat_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  JOIN chats c ON c.id = cp1.chat_id
  WHERE cp1.user_id = p_user_a
    AND cp2.user_id = p_user_b
    AND c.type = 'private'
  LIMIT 1;
$$;
