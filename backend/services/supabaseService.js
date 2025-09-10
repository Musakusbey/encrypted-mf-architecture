const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class SupabaseService {
    // Kullanıcı kaydı
    async registerUser(userData) {
        try {
            const { username, email, password } = userData;

            // Şifreyi hashle
            const passwordHash = await bcrypt.hash(password, 10);

            // Kullanıcıyı veritabanına ekle
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        username,
                        email,
                        password_hash: passwordHash,
                        role: 'user'
                    }
                ])
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            // JWT token oluştur
            const token = jwt.sign(
                {
                    userId: data.id,
                    username: data.username,
                    role: data.role,
                    timestamp: Date.now()
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Session'ı kaydet
            await this.createSession(data.id, token);

            return {
                success: true,
                message: 'Kullanıcı başarıyla oluşturuldu',
                token,
                user: {
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role
                }
            };
        } catch (error) {
            console.error('Kayıt hatası:', error);
            throw new Error(error.message || 'Kayıt işlemi başarısız');
        }
    }

    // Kullanıcı girişi
    async loginUser(credentials) {
        try {
            const { username, password } = credentials;

            // Kullanıcıyı bul
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !user) {
                throw new Error('Geçersiz kullanıcı adı veya şifre');
            }

            // Şifreyi kontrol et
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Geçersiz kullanıcı adı veya şifre');
            }

            // JWT token oluştur
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role,
                    timestamp: Date.now()
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Session'ı kaydet
            await this.createSession(user.id, token);

            return {
                success: true,
                message: 'Giriş başarılı',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            console.error('Giriş hatası:', error);
            throw new Error(error.message || 'Giriş işlemi başarısız');
        }
    }

    // Token doğrulama
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Kullanıcıyı veritabanından al
            const { data: user, error } = await supabase
                .from('users')
                .select('id, username, email, role')
                .eq('id', decoded.userId)
                .single();

            if (error || !user) {
                throw new Error('Geçersiz token');
            }

            return {
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            throw new Error('Geçersiz token');
        }
    }

    // Session oluştur
    async createSession(userId, token) {
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 saat

            const { error } = await supabase
                .from('user_sessions')
                .insert([
                    {
                        user_id: userId,
                        token,
                        expires_at: expiresAt.toISOString()
                    }
                ]);

            if (error) {
                console.error('Session oluşturma hatası:', error);
            }
        } catch (error) {
            console.error('Session oluşturma hatası:', error);
        }
    }

    // Modülleri getir
    async getModules() {
        try {
            const { data: modules, error } = await supabase
                .from('modules')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                modules: modules || [],
                totalModules: modules?.length || 0,
                message: 'Modül bilgileri başarıyla alındı'
            };
        } catch (error) {
            console.error('Modül getirme hatası:', error);
            throw new Error(error.message || 'Modül bilgileri alınamadı');
        }
    }

    // Kullanıcı profili getir
    async getUserProfile(userId) {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('id, username, email, role, created_at')
                .eq('id', userId)
                .single();

            if (error || !user) {
                throw new Error('Kullanıcı bulunamadı');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    loginTime: new Date().toLocaleString('tr-TR')
                },
                message: 'Profil bilgileri başarıyla alındı'
            };
        } catch (error) {
            console.error('Profil getirme hatası:', error);
            throw new Error(error.message || 'Profil bilgileri alınamadı');
        }
    }
}

module.exports = new SupabaseService();
