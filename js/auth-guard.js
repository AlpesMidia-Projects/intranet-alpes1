// js/auth-guard.js
import { supabase } from '/js/supabaseClient.js';

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    // Se NÃO houver sessão (usuário não logado), redireciona para o login
    if (!session) {
        window.location.href = '/login.html';
    }
}

checkAuth();