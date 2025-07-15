// js/login.js
import { supabase } from '/js/supabaseClient.js';

const loginButton = document.getElementById('google-login-btn');

loginButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Redireciona para o index.html após o login bem-sucedido
            scopes: 'https://www.googleapis.com/auth/calendar.readonly',
            redirectTo: window.location.origin + '/index.html'
        }
    });
    if (error) {
        console.error('Erro no login com Google:', error);
    }
});