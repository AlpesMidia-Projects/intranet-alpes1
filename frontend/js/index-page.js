import { API_BASE_URL } from './config.js'; 
import { supabase } from '/js/supabaseClient.js';
function atualizarMensagemDeBoasVindas(session) {
    if (!session) return; // Se não há sessão, não faz nada

    const nome = session.user.user_metadata.full_name || session.user.email;
    const welcomeUserName = document.getElementById('welcome-user-name');
    
    if (welcomeUserName) {
        welcomeUserName.textContent = nome;
    }
}

async function carregarAniversariantes() {
    const container = document.getElementById('aniversariantes-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/equipe/`);
        if (!response.ok) throw new Error('Falha ao buscar funcionários');
        const funcionarios = await response.json();

        const mesAtual = new Date().getMonth();
        const aniversariantes = funcionarios.filter(func => {
            if (!func.aniversario) return false;
            const dataAniversario = new Date(func.aniversario);
            return dataAniversario.getUTCMonth() === mesAtual;
        });

        container.innerHTML = ''; // Limpa o container
        if (aniversariantes.length === 0) {
            container.innerHTML = '<p>Nenhum aniversariante este mês.</p>';
            return;
        }

        // Mape para ordenar por dia do mês
        aniversariantes.sort((a, b) => new Date(a.aniversario).getUTCDate() - new Date(b.aniversario).getUTCDate());

        aniversariantes.forEach(func => {
            const dataAniversario = new Date(func.aniversario + 'T00:00:00');
            // Formata a data como "Mês Dia" (ex: "Jul 17")
            const dataFormatada = dataAniversario.toLocaleString('pt-BR', { month: 'short', day: '2-digit' }).replace('.', '');

            // NOVA ESTRUTURA HTML (MAIS SIMPLES)
            const itemHTML = `
                <div class="aniversariante-item">
                    <img class="aniversariante-avatar" src="${func.imagem_url || 'imagens/avatar-padrao.png'}" alt="Foto de ${func.nome}">
                    <span class="aniversariante-nome">${func.nome}</span>
                    <span class="aniversariante-data-tag">${dataFormatada}</span>
                </div>
            `;
            container.innerHTML += itemHTML;
        });

    } catch (error) {
        console.error("Erro ao carregar aniversariantes:", error);
        container.innerHTML = '<p style="color:red;">Erro ao carregar.</p>';
    }
}

async function carregarEventosDoCalendario(session) {
    const calendarEl = document.getElementById('meu-calendario-container');
    const listaEventosEl = document.getElementById('lista-eventos-container');
    if (!calendarEl || !listaEventosEl) return;
    if (!session) {
        calendarEl.innerHTML = '<p>Faça login para ver seu calendário.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/calendar-events/`, {
            headers: { 'Authorization': `Bearer ${session.provider_token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar eventos');
        const googleEvents = await response.json();

        // Lógica para o Calendário Principal (FullCalendar)
        const fullCalendarEvents = googleEvents.map(event => ({
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            url: event.htmlLink,
        }));
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
            buttonText: { today: 'Hoje' },
            events: fullCalendarEvents,
            eventClick: (info) => {
                info.jsEvent.preventDefault();
                if (info.event.url) window.open(info.event.url, "_blank");
            }
        });

        calendarEl.innerHTML = ''; // Limpa o container
        
        calendar.render();

        listaEventosEl.innerHTML = '';
        const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        if (googleEvents.length === 0) {
            listaEventosEl.innerHTML = '<p>Nenhum evento futuro.</p>';
            return;
        }

        googleEvents.slice(0, 4).forEach(event => { // Pega apenas os 4 primeiros eventos
            const dataInicio = new Date(event.start.dateTime || event.start.date);
            const dia = dataInicio.getDate();
            const mes = meses[dataInicio.getMonth()];
            const eventoHTML = `
                <div class="evento-item">
                    <div class="evento-data">
                        <div class="dia">${dia}</div>
                        <div class="mes">${mes}</div>
                    </div>
                    <div class="evento-borda"></div>
                    <p class="evento-titulo">${event.summary}</p>
                </div>
            `;
            listaEventosEl.innerHTML += eventoHTML;
        });

    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
    }
}


/**
 * 4. CARREGA OS PROJETOS COM O NOVO VISUAL "CLEAN"
 */
async function carregarProjetos() {
    const container = document.getElementById('projetos-container');
    if (!container) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/projetos/`);
        if (!response.ok) throw new Error('Falha ao buscar projetos');
        const projetos = await response.json();
        
        container.innerHTML = '';
        if (projetos.length === 0) {
            container.innerHTML = '<p>Nenhum projeto em andamento.</p>';
            return;
        }

        projetos.forEach(proj => {
            const cardHTML = `
              <div class="projeto-card-novo">
                <div class="projeto-imagem">
                  <img src="${proj.imagem_url || 'https://via.placeholder.com/150'}" alt="Imagem do Projeto ${proj.titulo}">
                </div>
                <div class="projeto-info">
                  <h3 class="projeto-titulo">${proj.titulo}</h3>
                  <p class="projeto-descricao">${proj.descricao}</p>
                  <div class="progresso-container">
                    <div class="barra-progresso" style="width: ${proj.progresso || 0}%;"></div>
                  </div>
                  <span class="projeto-porcentagem">${proj.progresso || 0}%</span>
                </div>
              </div>
            `;
            container.innerHTML += cardHTML;
        });
        
    } catch (error) {
        console.error("Erro ao carregar projetos:", error);
    }
}


/**
 * 5. NOVA FUNÇÃO PARA O BOTÃO "VOLTAR AO TOPO"
 */
function inicializarBotaoVoltarAoTopo() {
    const btn = document.getElementById('voltar-ao-topo-btn');
    if(!btn) return;
    
    // Mostra o botão quando o usuário rolar a página
    window.onscroll = function() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            btn.classList.add('visivel');
        } else {
            btn.classList.remove('visivel');
        }
    };
    
    // Rola para o topo quando o botão é clicado
    btn.onclick = function(e) {
        e.preventDefault();
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
}


// --- PONTO DE PARTIDA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Pega a sessão do usuário uma vez para usar em várias funções
    const { data: { session } } = await supabase.auth.getSession();

    // Chama todas as funções de carregamento
    carregarAniversariantes();
    carregarEventosDoCalendario(session);
    carregarProjetos();
    
    // Funções de UI
    atualizarMensagemDeBoasVindas(session);
    inicializarBotaoVoltarAoTopo();
});