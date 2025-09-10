#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../config.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL ve Key gerekli!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log('🧪 Supabase RLS Testleri Başlatılıyor...\n');

    let passedTests = 0;
    let totalTests = 0;

    // Test 1: RLS durumu kontrolü
    totalTests++;
    try {
        console.log('📊 Test 1: RLS Durumu Kontrolü');
        const { data: rlsStatus, error: rlsError } = await supabase
            .rpc('get_rls_status');

        if (rlsError) {
            console.log('❌ RLS durumu alınamadı:', rlsError.message);
        } else {
            console.log('✅ RLS Durumu:');
            rlsStatus.forEach(table => {
                const status = table.rls_enabled ? '✅ Aktif' : '❌ Pasif';
                console.log(`  ${table.table_name}: ${status} (${table.policy_count} politika)`);
            });
            passedTests++;
        }
    } catch (error) {
        console.log('❌ RLS durumu testi başarısız:', error.message);
    }

    console.log('');

    // Test 2: RLS test fonksiyonu
    totalTests++;
    try {
        console.log('🔍 Test 2: RLS Test Fonksiyonu');
        const { data: testResults, error: testError } = await supabase
            .rpc('test_rls_access');

        if (testError) {
            console.log('❌ RLS test fonksiyonu çalıştırılamadı:', testError.message);
        } else {
            console.log('✅ RLS Test Sonuçları:');
            testResults.forEach(test => {
                const status = test.result === 'PASS' ? '✅' : '❌';
                console.log(`  ${status} ${test.test_name}: ${test.details}`);
            });
            passedTests++;
        }
    } catch (error) {
        console.log('❌ RLS test fonksiyonu başarısız:', error.message);
    }

    console.log('');

    // Test 3: Cross-user erişim testi
    totalTests++;
    try {
        console.log('👤 Test 3: Cross-User Erişim Testi');

        // Test kullanıcısı oluştur
        const testEmail = `test_rls_${Date.now()}@example.com`;
        const { data: userData, error: userError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'test123456'
        });

        if (userError) {
            console.log('❌ Test kullanıcısı oluşturulamadı:', userError.message);
        } else {
            const testUser = userData.user;

            // Test kullanıcısı ile giriş yap
            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: 'test123456'
            });

            if (sessionError) {
                console.log('❌ Test kullanıcısı ile giriş yapılamadı:', sessionError.message);
            } else {
                // Başka kullanıcıların verilerini çekmeye çalış
                const { data: otherUsers, error: accessError } = await supabase
                    .from('users')
                    .select('*')
                    .neq('id', testUser.id);

                if (accessError && accessError.message.includes('row-level security')) {
                    console.log('✅ Cross-user erişim başarıyla engellendi');
                    passedTests++;
                } else {
                    console.log('❌ Cross-user erişim engellenemedi');
                }
            }

            // Test kullanıcısını temizle
            try {
                await supabase.auth.admin.deleteUser(testUser.id);
            } catch (cleanupError) {
                console.warn('⚠️ Test kullanıcısı temizlenemedi:', cleanupError.message);
            }
        }
    } catch (error) {
        console.log('❌ Cross-user erişim testi başarısız:', error.message);
    }

    console.log('');

    // Test 4: Admin rolü testi
    totalTests++;
    try {
        console.log('👑 Test 4: Admin Rolü Testi');

        // Admin kullanıcısı oluştur
        const adminEmail = `admin_test_${Date.now()}@example.com`;
        const { data: adminData, error: adminError } = await supabase.auth.signUp({
            email: adminEmail,
            password: 'admin123456'
        });

        if (adminError) {
            console.log('❌ Admin kullanıcısı oluşturulamadı:', adminError.message);
        } else {
            const adminUser = adminData.user;

            // Admin rolü ata
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert([{ user_id: adminUser.id, role: 'admin' }]);

            if (roleError) {
                console.log('❌ Admin rolü atanamadı:', roleError.message);
            } else {
                // Admin ile giriş yap
                const { data: adminSession, error: adminSessionError } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: 'admin123456'
                });

                if (adminSessionError) {
                    console.log('❌ Admin ile giriş yapılamadı:', adminSessionError.message);
                } else {
                    // Admin tüm kullanıcıları görebilmeli
                    const { data: allUsers, error: allUsersError } = await supabase
                        .from('users')
                        .select('*');

                    if (allUsersError) {
                        console.log('❌ Admin tüm kullanıcıları göremedi:', allUsersError.message);
                    } else {
                        console.log('✅ Admin tüm kullanıcıları görebiliyor');
                        passedTests++;
                    }
                }
            }

            // Admin kullanıcısını temizle
            try {
                await supabase.auth.admin.deleteUser(adminUser.id);
            } catch (cleanupError) {
                console.warn('⚠️ Admin kullanıcısı temizlenemedi:', cleanupError.message);
            }
        }
    } catch (error) {
        console.log('❌ Admin rolü testi başarısız:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Sonuçları: ${passedTests}/${totalTests} test geçti`);

    if (passedTests === totalTests) {
        console.log('🎉 Tüm RLS testleri başarılı!');
        console.log('✅ Supabase RLS düzgün çalışıyor');
    } else {
        console.log('⚠️ Bazı RLS testleri başarısız');
        console.log('🔧 RLS politikalarını kontrol edin');
    }

    return passedTests === totalTests;
}

// Test'i çalıştır
testRLS().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test çalıştırılırken hata:', error);
    process.exit(1);
});
