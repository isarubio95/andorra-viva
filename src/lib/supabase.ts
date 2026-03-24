import { createClient } from '@supabase/supabase-js';

// TODO: Reemplaza con tus credenciales de Supabase
const supabaseUrl = 'https://jyjrvpglviozrsezocbj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Lwxyua9-YRDgg1wnBePwow_5qDqi85m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
