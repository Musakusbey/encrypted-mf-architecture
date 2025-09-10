-- RLS (Row Level Security) Politikaları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- RLS'yi etkinleştir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users tablosu için politikalar
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Modules tablosu için politikalar
CREATE POLICY "Authenticated users can view modules" ON modules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage modules" ON modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- User sessions tablosu için politikalar
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (user_id::text = auth.uid()::text);

-- Audit logs tablosu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    module VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature TEXT NOT NULL
);

-- Audit logs için RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Güvenlik fonksiyonları
CREATE OR REPLACE FUNCTION check_user_permission(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı rolünü kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id::text = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Güvenlik görünümleri
CREATE VIEW user_permissions AS
SELECT 
    u.id,
    u.username,
    u.role,
    CASE 
        WHEN u.role = 'admin' THEN true
        ELSE false
    END as is_admin,
    CASE 
        WHEN u.role IN ('admin', 'moderator') THEN true
        ELSE false
    END as can_moderate
FROM users u
WHERE u.id::text = auth.uid()::text;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Güvenlik tetikleyicileri
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, details, signature)
    VALUES (
        NEW.id,
        TG_OP,
        jsonb_build_object(
            'old', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            'new', CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE NULL END
        ),
        'system_signature_' || extract(epoch from now())::text
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Users tablosu için tetikleyici
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

COMMENT ON TABLE users IS 'Kullanıcı bilgileri - RLS ile korunmuş';
COMMENT ON TABLE modules IS 'Sistem modülleri - RLS ile korunmuş';
COMMENT ON TABLE user_sessions IS 'Kullanıcı oturumları - RLS ile korunmuş';
COMMENT ON TABLE audit_logs IS 'Güvenlik audit logları - RLS ile korunmuş';
