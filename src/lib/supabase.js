
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xknozanpivdduavuunys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrbm96YW5waXZkZHVhdnV1bnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjk0ODMsImV4cCI6MjA2NDcwNTQ4M30.AzzZXtw4iCezsvwE2hjq_UMdUIJ-WIxcSOuOcWZSYXs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
