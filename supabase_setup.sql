-- =============================================
-- Supabase Chat Application Database Setup
-- =============================================

-- 기존 테이블이 있다면 삭제 (주의: 데이터가 모두 삭제됩니다)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. Users 테이블 생성
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. Messages 테이블 생성 (정규화된 구조)
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 인덱스 생성 (성능 최적화)
-- =============================================
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- =============================================
-- 4. RLS (Row Level Security) 설정
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. 보안 정책 설정
-- =============================================
-- Users 테이블: 모든 사용자가 읽고 쓸 수 있음
CREATE POLICY "Allow all operations on users" ON users 
FOR ALL USING (true);

-- Messages 테이블: 모든 사용자가 읽고 쓸 수 있음
CREATE POLICY "Allow all operations on messages" ON messages 
FOR ALL USING (true);

-- =============================================
-- 6. 테이블 정보 확인용 뷰 생성
-- =============================================
CREATE VIEW messages_with_users AS
SELECT 
  m.id,
  m.text,
  m.timestamp,
  m.created_at,
  m.user_id,
  u.name as user_name,
  u.color as user_color
FROM messages m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at ASC;

-- =============================================
-- 7. 샘플 데이터 삽입 (선택사항)
-- =============================================
-- 샘플 사용자 생성
INSERT INTO users (id, name, color) VALUES 
  ('00000000-0000-0000-0000-000000000001', '관리자', '#FF6B6B'),
  ('00000000-0000-0000-0000-000000000002', '테스터', '#4ECDC4');

-- 샘플 메시지 생성
INSERT INTO messages (text, timestamp, user_id) VALUES 
  ('안녕하세요! 채팅방에 오신 것을 환영합니다.', EXTRACT(EPOCH FROM NOW()) * 1000, '00000000-0000-0000-0000-000000000001'),
  ('실시간 채팅이 잘 작동하는지 테스트해보세요!', EXTRACT(EPOCH FROM NOW()) * 1000, '00000000-0000-0000-0000-000000000002');

-- =============================================
-- 완료 메시지
-- =============================================
-- 모든 테이블과 정책이 성공적으로 생성되었습니다!
-- 이제 Next.js 애플리케이션에서 Supabase를 사용할 수 있습니다.
