-- Supabase RLS Policies
-- Bu script Row Level Security'i aktif eder ve politikaları oluşturur

-- 1. RLS'yi aktif et
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 2. user_roles tablosu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

-- user_roles için RLS aktif et
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. audit_logs tablosu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    resource text,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    hash text,
    prev_hash text
);

-- 4. Users tablosu için politikalar
-- Kullanıcılar sadece kendi kayıtlarını görebilir
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin'ler tüm kullanıcıları görebilir
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admin'ler tüm kullanıcıları yönetebilir
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. user_sessions tablosu için politikalar
-- Kullanıcılar sadece kendi oturumlarını görebilir
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi oturumlarını silebilir
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Admin'ler tüm oturumları görebilir
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. audit_logs tablosu için politikalar
-- Admin'ler tüm audit logları görebilir
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Kullanıcılar sadece kendi audit loglarını görebilir
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- 7. modules tablosu için politikalar
-- Tüm authenticated kullanıcılar modülleri görebilir
CREATE POLICY "Authenticated users can view modules" ON public.modules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin'ler modülleri yönetebilir
CREATE POLICY "Admins can manage modules" ON public.modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 8. user_roles tablosu için politikalar
-- Kullanıcılar kendi rollerini görebilir
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admin'ler tüm rolleri yönetebilir
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Yeni kullanıcı kaydında otomatik 'user' rolü atama
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Audit log oluştur
    INSERT INTO public.audit_logs (user_id, action, resource, details)
    VALUES (NEW.id, 'user.created', 'users', jsonb_build_object('username', NEW.username, 'email', NEW.email));
    
    RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. RLS durumunu kontrol etmek için fonksiyon
CREATE OR REPLACE FUNCTION public.get_rls_status()
RETURNS TABLE (
    table_name text,
    rls_enabled boolean,
    policy_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        rowsecurity as rls_enabled,
        (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
    FROM pg_tables t
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'user_sessions', 'audit_logs', 'modules', 'user_roles')
    ORDER BY tablename;
END;
$$;

-- 11. Admin rolü atama fonksiyonu
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sadece mevcut admin'ler bu fonksiyonu çağırabilir
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin role required';
    END IF;
    
    -- Hedef kullanıcıya admin rolü ata
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Audit log oluştur
    INSERT INTO public.audit_logs (user_id, action, resource, details)
    VALUES (auth.uid(), 'role.assigned', 'user_roles', jsonb_build_object('target_user_id', target_user_id, 'role', 'admin'));
    
    RETURN true;
END;
$$;

-- 12. RLS test fonksiyonu
CREATE OR REPLACE FUNCTION public.test_rls_access()
RETURNS TABLE (
    test_name text,
    result text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_user_id uuid;
    test_result text;
BEGIN
    -- Test 1: RLS durumu
    RETURN QUERY
    SELECT 'RLS Status'::text, 
           CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
           'RLS enabled on ' || count(*) || ' tables'::text
    FROM public.get_rls_status() 
    WHERE rls_enabled = true;
    
    -- Test 2: Policy sayısı
    RETURN QUERY
    SELECT 'Policy Count'::text,
           CASE WHEN count(*) >= 10 THEN 'PASS' ELSE 'FAIL' END::text,
           'Found ' || count(*) || ' policies'::text
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Test 3: Admin fonksiyonu
    BEGIN
        PERFORM public.assign_admin_role(auth.uid());
        RETURN QUERY
        SELECT 'Admin Function'::text, 'PASS'::text, 'Admin assignment function works'::text;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY
            SELECT 'Admin Function'::text, 'FAIL'::text, SQLERRM::text;
    END;
END;
$$;

-- 13. RLS durumunu göster
SELECT 'RLS Setup Complete' as status;
SELECT * FROM public.get_rls_status();
SELECT 'RLS Test Results:' as info;
SELECT * FROM public.test_rls_access();