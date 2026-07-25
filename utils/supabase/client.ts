import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Khởi tạo client kết nối cơ sở dữ liệu
export const supabase = createClient(supabaseUrl, supabaseAnonKey)