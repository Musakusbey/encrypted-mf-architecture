const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const encryption = require('../utils/encryption');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

class SessionService {
    constructor() {
        this.refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 gün
    }

    // Yeni oturum oluştur
    async createSession(userId, ip, userAgent) {
        try {
            const jti = crypto.randomUUID();
            const refreshToken = this.generateRefreshToken();

            const sessionData = {
                jti,
                user_id: userId,
                refresh_token: refreshToken,
                ip_address: ip,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + this.refreshTokenExpiry).toISOString(),
                is_active: true,
                prev_jti: null
            };

            const { data, error } = await supabase
                .from('user_sessions')
                .insert([sessionData])
                .select()
                .single();

            if (error) {
                throw new Error(`Oturum oluşturulamadı: ${error.message}`);
            }

            return {
                jti,
                refreshToken,
                expiresAt: sessionData.expires_at
            };
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    // Refresh token ile yeni access token al
    async refreshAccessToken(refreshToken, ip, userAgent) {
        try {
            // Mevcut oturumu bul
            const { data: session, error: sessionError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('refresh_token', refreshToken)
                .eq('is_active', true)
                .single();

            if (sessionError || !session) {
                throw new Error('Geçersiz refresh token');
            }

            // Oturum süresi kontrolü
            if (new Date(session.expires_at) < new Date()) {
                await this.revokeSession(session.jti, 'expired');
                throw new Error('Refresh token süresi dolmuş');
            }

            // IP ve User Agent kontrolü (güvenlik)
            if (session.ip_address !== ip || session.user_agent !== userAgent) {
                console.warn(`Şüpheli refresh token kullanımı: ${session.jti}`);
                await this.revokeSessionChain(session.jti);
                throw new Error('Güvenlik ihlali - tüm oturumlar sonlandırıldı');
            }

            // Yeni refresh token oluştur (rotasyon)
            const newJti = crypto.randomUUID();
            const newRefreshToken = this.generateRefreshToken();

            // Eski oturumu güncelle
            const { error: updateError } = await supabase
                .from('user_sessions')
                .update({
                    is_active: false,
                    revoked_at: new Date().toISOString(),
                    revoked_reason: 'rotated'
                })
                .eq('jti', session.jti);

            if (updateError) {
                throw new Error(`Oturum güncellenemedi: ${updateError.message}`);
            }

            // Yeni oturum oluştur
            const newSessionData = {
                jti: newJti,
                user_id: session.user_id,
                refresh_token: newRefreshToken,
                ip_address: ip,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + this.refreshTokenExpiry).toISOString(),
                is_active: true,
                prev_jti: session.jti
            };

            const { data: newSession, error: newSessionError } = await supabase
                .from('user_sessions')
                .insert([newSessionData])
                .select()
                .single();

            if (newSessionError) {
                throw new Error(`Yeni oturum oluşturulamadı: ${newSessionError.message}`);
            }

            // Yeni access token oluştur
            const accessToken = this.generateAccessToken(session.user_id);

            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresAt: newSessionData.expires_at,
                jti: newJti
            };
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    // Oturumu sonlandır
    async revokeSession(jti, reason = 'manual') {
        try {
            const { error } = await supabase
                .from('user_sessions')
                .update({
                    is_active: false,
                    revoked_at: new Date().toISOString(),
                    revoked_reason: reason
                })
                .eq('jti', jti);

            if (error) {
                throw new Error(`Oturum sonlandırılamadı: ${error.message}`);
            }

            console.log(`Oturum sonlandırıldı: ${jti} (${reason})`);
            return true;
        } catch (error) {
            console.error('Session revocation error:', error);
            throw error;
        }
    }

    // Oturum zincirini sonlandır (güvenlik ihlali durumunda)
    async revokeSessionChain(jti) {
        try {
            // Tüm aktif oturumları bul ve sonlandır
            const { data: sessions, error: fetchError } = await supabase
                .from('user_sessions')
                .select('jti, user_id')
                .eq('is_active', true);

            if (fetchError) {
                throw new Error(`Oturumlar alınamadı: ${fetchError.message}`);
            }

            // Aynı kullanıcının tüm oturumlarını sonlandır
            const userId = sessions.find(s => s.jti === jti)?.user_id;
            if (userId) {
                const { error: revokeError } = await supabase
                    .from('user_sessions')
                    .update({
                        is_active: false,
                        revoked_at: new Date().toISOString(),
                        revoked_reason: 'security_breach'
                    })
                    .eq('user_id', userId)
                    .eq('is_active', true);

                if (revokeError) {
                    throw new Error(`Oturum zinciri sonlandırılamadı: ${revokeError.message}`);
                }

                console.log(`Güvenlik ihlali - Tüm oturumlar sonlandırıldı: ${userId}`);
            }

            return true;
        } catch (error) {
            console.error('Session chain revocation error:', error);
            throw error;
        }
    }

    // Kullanıcının aktif oturumlarını getir
    async getUserSessions(userId) {
        try {
            const { data: sessions, error } = await supabase
                .from('user_sessions')
                .select('jti, ip_address, user_agent, created_at, expires_at, is_active')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Oturumlar alınamadı: ${error.message}`);
            }

            return sessions.map(session => ({
                jti: session.jti,
                ip: session.ip_address,
                userAgent: session.user_agent,
                createdAt: session.created_at,
                expiresAt: session.expires_at,
                isActive: session.is_active
            }));
        } catch (error) {
            console.error('Get user sessions error:', error);
            throw error;
        }
    }

    // Refresh token oluştur
    generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    // Access token oluştur
    generateAccessToken(userId) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            {
                userId,
                role: 'user',
                timestamp: Date.now()
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '15m' }
        );
    }

    // Oturum istatistikleri
    async getSessionStats() {
        try {
            const { data: stats, error } = await supabase
                .from('user_sessions')
                .select('is_active, created_at')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) {
                throw new Error(`İstatistikler alınamadı: ${error.message}`);
            }

            const activeSessions = stats.filter(s => s.is_active).length;
            const totalSessions = stats.length;
            const revokedSessions = totalSessions - activeSessions;

            return {
                activeSessions,
                totalSessions,
                revokedSessions,
                last24Hours: totalSessions
            };
        } catch (error) {
            console.error('Session stats error:', error);
            throw error;
        }
    }
}

module.exports = new SessionService();
