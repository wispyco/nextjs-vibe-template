-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
  ON ai_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS policies for ai_messages
CREATE POLICY "Users can view messages in their conversations"
  ON ai_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON ai_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
        AND ai_conversations.user_id = auth.uid()
    )
  );

-- Function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is added
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Function to auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND NOT EXISTS (
    SELECT 1 FROM ai_messages 
    WHERE conversation_id = NEW.conversation_id 
      AND id != NEW.id
  ) THEN
    UPDATE ai_conversations
    SET title = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id
      AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate title from first user message
CREATE TRIGGER generate_title_on_first_message
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_conversation_title();