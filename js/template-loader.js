// js/template-loader.js
import { supabase } from '/js/supabaseClient.js';

// Função para carregar componentes HTML (versão única e correta)
async function loadComponent(url, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.warn(`Placeholder com id '${placeholderId}' não encontrado.`);
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Componente em '${url}' não encontrado (404)`);
        const html = await response.text();
        placeholder.innerHTML = html;
    } catch (error) {
        console.error(`Falha ao carregar componente: ${error}`);
        placeholder.innerHTML = `<p style="color:red; font-size:12px;">Erro ao carregar ${placeholderId}</p>`;
    }
}

// Função para marcar o link de navegação ativo na barra lateral
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('#sidebar-placeholder .menu-principal a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        const listItem = link.parentElement;

        if (linkPage === currentPage) {
            listItem.classList.add('ativo');
        } else {
            listItem.classList.remove('ativo');
        }
    });
}

// Função para atualizar a área de login/logout do usuário
async function updateUserStatus() {
    // Procura os elementos depois que os componentes foram carregados
    const userLoggedIn = document.getElementById('user-logged-in');
    const userLoggedOut = document.getElementById('user-logged-out');
    const userAvatar = document.getElementById('user-avatar');
    const userNameElement = document.getElementById('user-name'); // Pega o elemento do nome
    const logoutBtn = document.getElementById('logout-btn');

    // Se os elementos essenciais não existirem, não faz nada
    if (!userLoggedIn || !userLoggedOut) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        userLoggedOut.style.display = 'none';
        userLoggedIn.style.display = 'flex';
        
        if (userAvatar) {
            userAvatar.src = session.user.user_metadata.avatar_url || 'imagens/avatar-padrao.png';
        }
        if (userNameElement) {
            userNameElement.textContent = session.user.user_metadata.full_name || session.user.email;
        }
        
    } else {
        userLoggedOut.style.display = 'block';
        userLoggedIn.style.display = 'none';
    }

    if (logoutBtn) {
        // Remove eventuais listeners antigos para evitar duplicação
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        });
    }
}

async function initializePage() {
    await Promise.all([
        loadComponent('/_header.html', 'header-placeholder'),
        loadComponent('/_nav-sidebar.html', 'sidebar-placeholder'),
        loadComponent('/_widgets-sidebar.html', 'widgets-placeholder')
    ]);

    setActiveNav();
    updateUserStatus();
    initializeUIButtons();
}

function initializeUIButtons() {
    const toggleButton = document.getElementById('toggle-widgets-btn');
    const widgetsColuna = document.querySelector('.coluna-widgets');
    if (toggleButton && widgetsColuna) {
        toggleButton.addEventListener('click', () => {
            widgetsColuna.classList.toggle('recolhida');
        });
    }

    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');

    if (userProfileTrigger && userDropdownMenu) {
        userProfileTrigger.addEventListener('click', (event) => {
            event.stopPropagation(); 
            userDropdownMenu.classList.toggle('ativo');
        });

        // Fecha o menu se clicar em qualquer outro lugar da página
        window.addEventListener('click', () => {
            if (userDropdownMenu.classList.contains('ativo')) {
                userDropdownMenu.classList.remove('ativo');
            }
        });
    }
}

// Inicia todo o processo quando a estrutura da página estiver pronta
document.addEventListener('DOMContentLoaded', initializePage);