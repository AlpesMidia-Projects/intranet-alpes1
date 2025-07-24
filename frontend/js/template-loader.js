// js/template-loader.js
import { API_BASE_URL } from './config.js'; 
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

async function carregarEnquete() {
    const container = document.getElementById('enquete-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/enquete-ativa/`);
        const enquete = await response.json();

        // Se não houver enquete ativa, exibe uma mensagem e para.
        if (!enquete || !enquete.id) {
            container.innerHTML = '<p>Nenhuma enquete ativa no momento.</p>';
            return;
        }

        const enqueteId = `votou_enquete_${enquete.id}`;
        const jaVotou = localStorage.getItem(enqueteId);

        // Define o título da enquete
        container.innerHTML = `<p class="enquete-pergunta">${enquete.pergunta}</p>`;

        if (jaVotou) {
            // Se já votou, mostra os resultados
            mostrarResultados(enquete);
        } else {
            // Se não votou, mostra as opções
            mostrarOpcoes(enquete);
        }

    } catch (error) {
        console.error("Erro ao carregar enquete:", error);
        container.innerHTML = '<p style="color:red;">Erro ao carregar enquete.</p>';
    }
}

function mostrarOpcoes(enquete) {
    const container = document.getElementById('enquete-container');
    const form = document.createElement('form');
    form.className = 'enquete-form';
    
    enquete.opcoes.forEach(opcao => {
        form.innerHTML += `
            <div class="enquete-opcao">
                <input type="radio" name="enquete" id="opcao-${opcao.id}" value="${opcao.id}">
                <label for="opcao-${opcao.id}">${opcao.texto_opcao}</label>
            </div>
        `;
    });

    const botaoVotar = document.createElement('button');
    botaoVotar.type = 'submit';
    botaoVotar.textContent = 'Votar';
    form.appendChild(botaoVotar);
    container.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const opcaoSelecionada = form.querySelector('input[name="enquete"]:checked');
        if (!opcaoSelecionada) {
            alert('Por favor, selecione uma opção.');
            return;
        }
        
        // Envia o voto para a API
        await fetch(`${API_BASE_URL}/api/opcoes/${opcaoSelecionada.value}/votar/`, { method: 'POST' });
        
        // Marca no localStorage que o usuário votou
        localStorage.setItem(`votou_enquete_${enquete.id}`, 'true');
        
        // Atualiza a visualização para mostrar os resultados
        carregarEnquete(); 
    });
}

function mostrarResultados(enquete) {
    const container = document.getElementById('enquete-container');
    const resultadosDiv = document.createElement('div');
    resultadosDiv.className = 'enquete-resultados';

    let totalVotos = 0;
    enquete.opcoes.forEach(opcao => totalVotos += opcao.votos);
    if (totalVotos === 0) totalVotos = 1; // Evita divisão por zero

    enquete.opcoes.forEach(opcao => {
        const porcentagem = Math.round((opcao.votos / totalVotos) * 100);
        resultadosDiv.innerHTML += `
            <div class="resultado-item">
                <div class="resultado-info">
                    <span>${opcao.texto_opcao}</span>
                    <span>${porcentagem}%</span>
                </div>
                <div class="resultado-barra-fundo">
                    <div class="resultado-barra-preenchimento" style="width: ${porcentagem}%;"></div>
                </div>
            </div>
        `;
    });
    
    container.appendChild(resultadosDiv);
}

async function initializePage() {
    await Promise.all([
        loadComponent('/_header.html', 'header-placeholder'),
        loadComponent('/_nav-sidebar.html', 'sidebar-placeholder'),
        loadComponent('/_widgets-sidebar.html', 'widgets-placeholder'),
        loadComponent('/_footer.html', 'footer-placeholder')
    ]);

    setActiveNav();
    updateUserStatus();
    initializeUIButtons();
    verificarNoticiasNovas();
    initializeThemeSwitcher();
    carregarPostsRecentes();
    carregarEnquete();
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

async function verificarNoticiasNovas() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/noticias/`);
        const noticias = await response.json();
        if (noticias.length === 0) return;

        // Pega os IDs das notícias que o usuário já viu
        const noticiasVistas = JSON.parse(localStorage.getItem('noticias_vistas')) || [];
        
        // Filtra para encontrar notícias que ainda não foram vistas
        const noticiasNovas = noticias.filter(n => !noticiasVistas.includes(n.id));

        if (noticiasNovas.length > 0) {
            const noticiaMaisRecente = noticiasNovas[0];
            const popup = document.getElementById('popup-noticia');
            
            document.getElementById('popup-titulo').textContent = noticiaMaisRecente.titulo;
            popup.style.display = 'flex';

            document.getElementById('popup-fechar').onclick = () => popup.style.display = 'none';
            document.getElementById('popup-ver-noticia').onclick = () => {
                window.location.href = '/noticias.html';
            };

            // Marca todas as notícias novas como vistas para não mostrar o popup novamente
            const todosOsIds = noticias.map(n => n.id);
            localStorage.setItem('noticias_vistas', JSON.stringify(todosOsIds));
        }
    } catch (error) {
        console.error('Erro ao verificar notícias novas:', error);
    }
}

function initializeThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // 1. Verifica no localStorage se o tema escuro já estava ativo
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    // 2. Adiciona o evento de clique no interruptor
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark'); // Salva a escolha
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light'); // Salva a escolha
        }
    });
}

async function carregarPostsRecentes() {
    const container = document.getElementById('posts-recentes-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/noticias-recentes/`);
        const noticias = await response.json();

        container.innerHTML = '';
        if (noticias.length === 0) {
            container.innerHTML = '<p>Nenhuma notícia recente.</p>';
            return;
        }

        const lista = document.createElement('ul');
        lista.className = 'lista-posts-recentes';
        noticias.forEach(noticia => {
            const item = document.createElement('li');
            item.innerHTML = `<a href="/noticias.html">${noticia.titulo}</a>`;
            lista.appendChild(item);
        });
        container.appendChild(lista);

    } catch (error) {
        console.error("Erro ao carregar posts recentes:", error);
        container.innerHTML = '<p style="color:red;">Erro ao carregar.</p>';
    }
}

// Inicia todo o processo quando a estrutura da página estiver pronta
document.addEventListener('DOMContentLoaded', initializePage);