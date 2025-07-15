// js/template-loader.js
import { supabase } from '/js/supabaseClient.js';

// Função para atualizar a navbar com base na sessão
async function updateUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    const userLoggedIn = document.getElementById('user-logged-in');
    const userLoggedOut = document.getElementById('user-logged-out');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    if (session) { // Usuário está logado
        userLoggedOut.style.display = 'none';
        userLoggedIn.style.display = 'block';
        userAvatar.src = session.user.user_metadata.avatar_url;
    } else { // Usuário está deslogado
        userLoggedOut.style.display = 'block';
        userLoggedIn.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = '/login.html'; // Redireciona para o login após sair
        });
    }
}

// Função para carregar componentes HTML
const loadComponent = async (url, placeholderId) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao carregar componente");
        const data = await response.text();
        document.getElementById(placeholderId).innerHTML = data;
    } catch (error) {
        console.error('Falha no carregamento do componente:', error);
    }
};

// Evento principal que carrega tudo
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponent('/header.html', 'header-placeholder');
    await loadComponent('/footer.html', 'footer-placeholder');

    // Depois que o header for carregado, atualiza o status do usuário
    updateUserStatus();
});