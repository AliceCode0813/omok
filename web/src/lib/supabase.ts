import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Room } from "@/lib/game";

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. .env.local 파일을 확인하세요.",
    );
  }

  client = createClient(url, key);
  return client;
}

export type { Room };
