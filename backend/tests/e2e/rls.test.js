const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL ve Key gerekli!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Supabase RLS E2E Tests', () => {
    let testUser1, testUser2, adminUser;
    let testUser1Token, testUser2Token, adminToken;

    beforeAll(async () => {
        // Test kullanıcıları oluştur
        console.log('🧪 Test kullanıcıları oluşturuluyor...');

        // User 1
        const { data: user1Data, error: user1Error } = await supabase.auth.signUp({
            email: 'testuser1@example.com',
            password: 'test123456'
        });
        if (user1Error) throw user1Error;
        testUser1 = user1Data.user;

        // User 2
        const { data: user2Data, error: user2Error } = await supabase.auth.signUp({
            email: 'testuser2@example.com',
            password: 'test123456'
        });
        if (user2Error) throw user2Error;
        testUser2 = user2Data.user;

        // Admin user
        const { data: adminData, error: adminError } = await supabase.auth.signUp({
            email: 'admin@example.com',
            password: 'admin123456'
        });
        if (adminError) throw adminError;
        adminUser = adminData.user;

        // Admin rolü ata
        const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{ user_id: adminUser.id, role: 'admin' }]);
        if (roleError) throw roleError;

        console.log('✅ Test kullanıcıları oluşturuldu');
    });

    afterAll(async () => {
        // Test kullanıcılarını temizle
        console.log('🧹 Test kullanıcıları temizleniyor...');

        try {
            await supabase.auth.admin.deleteUser(testUser1.id);
            await supabase.auth.admin.deleteUser(testUser2.id);
            await supabase.auth.admin.deleteUser(adminUser.id);
        } catch (error) {
            console.warn('Test kullanıcıları temizlenirken hata:', error);
        }
    });

    describe('RLS Policy Tests', () => {
        test('Kullanıcı sadece kendi profilini görebilmeli', async () => {
            // User 1 ile giriş yap
            const { data: session1, error: login1Error } = await supabase.auth.signInWithPassword({
                email: 'testuser1@example.com',
                password: 'test123456'
            });
            if (login1Error) throw login1Error;
            testUser1Token = session1.session.access_token;

            // User 1 kendi profilini görebilmeli
            const { data: ownProfile, error: ownProfileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', testUser1.id)
                .single();

            expect(ownProfileError).toBeNull();
            expect(ownProfile).toBeTruthy();
            expect(ownProfile.id).toBe(testUser1.id);

            // User 1 başka kullanıcının profilini görememeli
            const { data: otherProfile, error: otherProfileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', testUser2.id)
                .single();

            expect(otherProfileError).toBeTruthy();
            expect(otherProfileError.message).toContain('row-level security');
            expect(otherProfile).toBeNull();
        });

        test('Admin tüm kullanıcıları görebilmeli', async () => {
            // Admin ile giriş yap
            const { data: adminSession, error: adminLoginError } = await supabase.auth.signInWithPassword({
                email: 'admin@example.com',
                password: 'admin123456'
            });
            if (adminLoginError) throw adminLoginError;
            adminToken = adminSession.session.access_token;

            // Admin tüm kullanıcıları görebilmeli
            const { data: allUsers, error: allUsersError } = await supabase
                .from('users')
                .select('*');

            expect(allUsersError).toBeNull();
            expect(allUsers).toBeTruthy();
            expect(allUsers.length).toBeGreaterThan(0);
        });

        test('Kullanıcı sadece kendi oturumlarını görebilmeli', async () => {
            // User 1 ile giriş yap
            const { data: session1, error: login1Error } = await supabase.auth.signInWithPassword({
                email: 'testuser1@example.com',
                password: 'test123456'
            });
            if (login1Error) throw login1Error;

            // User 1 kendi oturumlarını görebilmeli
            const { data: ownSessions, error: ownSessionsError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', testUser1.id);

            expect(ownSessionsError).toBeNull();
            expect(ownSessions).toBeTruthy();

            // User 1 başka kullanıcının oturumlarını görememeli
            const { data: otherSessions, error: otherSessionsError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', testUser2.id);

            expect(otherSessionsError).toBeTruthy();
            expect(otherSessionsError.message).toContain('row-level security');
        });

        test('RLS durumu kontrol edilmeli', async () => {
            // RLS durumunu kontrol et
            const { data: rlsStatus, error: rlsError } = await supabase
                .rpc('get_rls_status');

            expect(rlsError).toBeNull();
            expect(rlsStatus).toBeTruthy();
            expect(rlsStatus.length).toBeGreaterThan(0);

            // Tüm tablolarda RLS aktif olmalı
            rlsStatus.forEach(table => {
                expect(table.rls_enabled).toBe(true);
                expect(table.policy_count).toBeGreaterThan(0);
            });
        });

        test('RLS test fonksiyonu çalışmalı', async () => {
            // RLS test fonksiyonunu çalıştır
            const { data: testResults, error: testError } = await supabase
                .rpc('test_rls_access');

            expect(testError).toBeNull();
            expect(testResults).toBeTruthy();
            expect(testResults.length).toBeGreaterThan(0);

            // Tüm testler geçmeli
            testResults.forEach(test => {
                expect(test.result).toBe('PASS');
            });
        });
    });

    describe('Cross-User Access Tests', () => {
        test('Kullanıcı başka kullanıcının verilerini güncelleyememeli', async () => {
            // User 1 ile giriş yap
            const { data: session1, error: login1Error } = await supabase.auth.signInWithPassword({
                email: 'testuser1@example.com',
                password: 'test123456'
            });
            if (login1Error) throw login1Error;

            // User 1 başka kullanıcının profilini güncellemeye çalış
            const { data: updateResult, error: updateError } = await supabase
                .from('users')
                .update({ username: 'hacked' })
                .eq('id', testUser2.id);

            expect(updateError).toBeTruthy();
            expect(updateError.message).toContain('row-level security');
            expect(updateResult).toBeNull();
        });

        test('Kullanıcı başka kullanıcının oturumunu sonlandıramamalı', async () => {
            // User 1 ile giriş yap
            const { data: session1, error: login1Error } = await supabase.auth.signInWithPassword({
                email: 'testuser1@example.com',
                password: 'test123456'
            });
            if (login1Error) throw login1Error;

            // User 1 başka kullanıcının oturumunu sonlandırmaya çalış
            const { data: deleteResult, error: deleteError } = await supabase
                .from('user_sessions')
                .delete()
                .eq('user_id', testUser2.id);

            expect(deleteError).toBeTruthy();
            expect(deleteError.message).toContain('row-level security');
            expect(deleteResult).toBeNull();
        });
    });

    describe('Admin Privilege Tests', () => {
        test('Admin tüm kullanıcıları yönetebilmeli', async () => {
            // Admin ile giriş yap
            const { data: adminSession, error: adminLoginError } = await supabase.auth.signInWithPassword({
                email: 'admin@example.com',
                password: 'admin123456'
            });
            if (adminLoginError) throw adminLoginError;

            // Admin başka kullanıcının profilini güncelleyebilmeli
            const { data: updateResult, error: updateError } = await supabase
                .from('users')
                .update({ username: 'admin_updated' })
                .eq('id', testUser1.id);

            expect(updateError).toBeNull();
            expect(updateResult).toBeTruthy();
        });

        test('Admin tüm audit logları görebilmeli', async () => {
            // Admin ile giriş yap
            const { data: adminSession, error: adminLoginError } = await supabase.auth.signInWithPassword({
                email: 'admin@example.com',
                password: 'admin123456'
            });
            if (adminLoginError) throw adminLoginError;

            // Admin tüm audit logları görebilmeli
            const { data: auditLogs, error: auditError } = await supabase
                .from('audit_logs')
                .select('*')
                .limit(10);

            expect(auditError).toBeNull();
            expect(auditLogs).toBeTruthy();
        });
    });
});

// Test runner
if (require.main === module) {
    const { execSync } = require('child_process');

    console.log('🚀 RLS E2E Testleri Başlatılıyor...');

    try {
        // Testleri çalıştır
        execSync('npm test -- --testPathPattern=rls.test.js', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('✅ RLS E2E Testleri Başarılı!');
    } catch (error) {
        console.error('❌ RLS E2E Testleri Başarısız:', error.message);
        process.exit(1);
    }
}
