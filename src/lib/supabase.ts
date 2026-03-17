import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxzhypsyzzmuzqaljbnr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6Z4t8cT8d2GaSM-iscCwIA_22RN__Zv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);