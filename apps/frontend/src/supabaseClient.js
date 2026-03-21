import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ugesrwzveiybyoidimvo.supabase.co"
const supabaseAnonKey = "sb_publishable_SQT0pxc5Y4E5jS6faWn9fA_2Mvc9h3U"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
