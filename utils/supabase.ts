import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// ⚠️ ATENÇÃO: Substitua pelos seus valores reais do painel do Supabase!
// O ID do projeto parece ser 'qybwcgnhryhchmrtmvic' baseado na sua string de conexão,
// mas você precisa confirmar a URL exata e pegar a 'anon public key' nas configurações de API do Supabase.

const supabaseUrl = "https://qybwcgnhryhchmrtmvic.supabase.co"; // URL confirmada
const supabaseAnonKey = "sb_publishable_S6ltU958P1joUvMQN0qS-g_n0jkzNaH"; // Chave configurada

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
