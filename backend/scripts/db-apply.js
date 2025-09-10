#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../config.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL ve Key gerekli!');
    console.error('config.env dosyasında SUPABASE_URL ve SUPABASE_ANON_KEY tanımlayın.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSPolicies() {
    try {
        console.log('🔐 RLS politikaları uygulanıyor...');

        // SQL dosyasını oku
        const sqlPath = path.join(__dirname, '../sql/rls_policies.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // SQL'i çalıştır
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ RLS politikaları uygulanırken hata:', error);
            return false;
        }

        console.log('✅ RLS politikaları başarıyla uygulandı!');
        return true;

    } catch (error) {
        console.error('❌ RLS uygulama hatası:', error.message);
        return false;
    }
}

async function testRLS() {
    try {
        console.log('🧪 RLS testi yapılıyor...');

        // RLS durumunu kontrol et
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('get_rls_status')
            .select('*');

        if (rlsError) {
            console.error('❌ RLS durumu kontrol edilemedi:', rlsError);
            return false;
        }

        console.log('📊 RLS Durumu:');
        rlsStatus.forEach(row => {
            console.log(`  ${row.table_name}: ${row.rls_enabled ? '✅ Aktif' : '❌ Pasif'} (${row.policy_count} politika)`);
        });

        // Test kullanıcısı oluştur
        const testUser = {
            username: 'test_rls_user',
            email: 'test_rls@example.com',
            password: 'test123456'
        };

        console.log('👤 Test kullanıcısı oluşturuluyor...');
        const { data: userData, error: userError } = await supabase.auth.signUp({
            email: testUser.email,
            password: testUser.password
        });

        if (userError) {
            console.error('❌ Test kullanıcısı oluşturulamadı:', userError);
            return false;
        }

        console.log('✅ Test kullanıcısı oluşturuldu:', userData.user?.id);

        // Cross-user erişim testi
        console.log('🔒 Cross-user erişim testi...');
        const { data: otherUsers, error: accessError } = await supabase
            .from('users')
            .select('*');

        if (accessError) {
            console.log('✅ RLS çalışıyor - Cross-user erişim engellendi:', accessError.message);
        } else {
            console.log('⚠️ RLS uyarısı - Cross-user erişim mümkün görünüyor');
        }

        return true;

    } catch (error) {
        console.error('❌ RLS test hatası:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Supabase RLS Kurulumu Başlatılıyor...\n');

    const rlsApplied = await applyRLSPolicies();
    if (!rlsApplied) {
        process.exit(1);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    const testPassed = await testRLS();
    if (!testPassed) {
        process.exit(1);
    }

    console.log('\n🎉 RLS kurulumu ve testi tamamlandı!');
    console.log('📋 Sonraki adımlar:');
    console.log('  1. Admin kullanıcısı oluşturun');
    console.log('  2. RLS politikalarını test edin');
    console.log('  3. Güvenlik Merkezi\'nde RLS durumunu kontrol edin');
}

main().catch(console.error);
