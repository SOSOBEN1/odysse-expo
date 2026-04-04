import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjyqecksqhhsmkywtrgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeXFlY2tzcWhoc21reXd0cmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDIxMzgsImV4cCI6MjA4ODMxODEzOH0.JbXLTHZMqkL9TlEK1fGKSkTSpIqSznDgrv5Ii2bq90A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);