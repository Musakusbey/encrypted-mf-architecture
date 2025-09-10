const { createClient } = require('@supabase/supabase-js');

// Supabase konfigürasyonu
const supabaseUrl = 'https://oplzivlmriqmebflugbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbHppdmxtcmlxbWViZmx1Z2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTAyMDgsImV4cCI6MjA3MzA2NjIwOH0.s8gMShQBI3sAzAdUf6zM9TsthBKJlpI4FYi7qAA4NOA';

// Supabase client oluştur (anon key ile)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
