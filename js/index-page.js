import { supabase } from '/js/supabaseClient.js';

function ativarLogicaModalProjetos() {
    const modal = document.getElementById('modal-detalhes');
    if (!modal) {
        console.error("Modal não encontrado!");
        return;
    }
    const botoesDetalhes = document.querySelectorAll('.projeto-detalhes');
    const closeButton = modal.querySelector('.close-button');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalDescricao = document.getElementById('modal-descricao');
    const modalBarraProgresso = document.getElementById('modal-barra-progresso');
    const modalPorcentagem = document.getElementById('modal-porcentagem');
    const modalTarefasLista = document.querySelector('#modal-tarefas ul');

botoesDetalhes.forEach(button => {
        button.addEventListener('click', function() {
            modalTitulo.textContent = this.dataset.titulo;
            modalDescricao.textContent = this.dataset.descricao;
            modalBarraProgresso.style.width = this.dataset.progresso + '%';
            modalPorcentagem.textContent = this.dataset.progresso + '%';
            
            const tarefas = this.dataset.tarefas ? this.dataset.tarefas.split(';') : [];
            modalTarefasLista.innerHTML = '';
            tarefas.forEach(tarefa => {
                if (tarefa) {
                    const li = document.createElement('li');
                    li.textContent = tarefa;
                    modalTarefasLista.appendChild(li);
                }
            });

            // NOVO CÓDIGO: Abre o modal e gerencia o foco
            modal.style.display = 'block';
            document.body.classList.add('modal-open'); // Bloqueia scroll
            closeButton.focus(); // Foca no botão de fechar

            // Armazena o botão que abriu o modal (para devolver o foco depois)
            modal.dataset.openedBy = this.id || this.textContent.trim();
        });
    });

    // NOVO CÓDIGO: Fecha o modal com Esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Devolve o foco para o botão que abriu o modal
            const opener = document.querySelector(`[data-titulo="${modal.dataset.openedBy}"]`) || 
                          document.querySelector('.projeto-detalhes');
            if (opener) opener.focus();
        }
    });

    // Fecha ao clicar no X ou fora do modal
    closeButton.addEventListener('click', () => fecharModal(modal));
    modal.addEventListener('click', (event) => {
        if (event.target === modal) fecharModal(modal);
    });

    // Função auxiliar para fechar
    function fecharModal(modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}    

// --- FUNÇÃO PARA ANIVERSARIANTES ---
async function carregarAniversariantes() {
  const container = document.getElementById('aniversariantes-container');
  if (!container) return;

  try {
    const { data: funcionarios, error } = await supabase
      .from('funcionarios')
      .select('*');

    if (error) throw error;

    const mesAtual = new Date().getMonth() + 1;

    const aniversariantes = funcionarios.filter(func => {
      const data = new Date(func.aniversario);
      return data.getMonth() + 1 === mesAtual;
    });

    container.innerHTML = '';

    if (aniversariantes.length === 0) {
      document.querySelector('.section_aniversariantes_moderna').style.display = 'none';
      return;
    }

    aniversariantes.forEach(func => {
      const dataAniversario = new Date(func.aniversario + 'T00:00:00');
      const dia = String(dataAniversario.getDate()).padStart(2, '0');
      const mes = String(dataAniversario.getMonth() + 1).padStart(2, '0');

      const slide = document.createElement('div');
      slide.classList.add('embla__slide');
      slide.innerHTML = `
        <div class="aniversariante-card-novo">
          <div class="foto-container">
            <img src="${func.imagem_url || 'imagens/avatar-padrao.png'}"
                 onerror="this.src='imagens/avatar-padrao.png'" 
                 alt="Foto de ${func.nome}">
          </div>
          <div class="info-container">
            <h3 class="nome-aniversariante">${func.nome}</h3>
            <p class="cargo-aniversariante">${func.cargo || ''}</p>
            <div class="data-aniversario">${dia}.${mes}</div>
          </div>
        </div>
      `;
      container.appendChild(slide);
    });

    const emblaNode = document.querySelector('.embla');
    const options = { loop: false, align: 'center' };
    const embla = EmblaCarousel(emblaNode.querySelector('.embla__viewport'), options);

    document.querySelector('.embla__prev').addEventListener('click', embla.scrollPrev);
    document.querySelector('.embla__next').addEventListener('click', embla.scrollNext);

  } catch (error) {
    console.error("Erro ao carregar aniversariantes:", error);
  }
}

// --- FUNÇÃO PARA PROJETOS ---
async function carregarProjetos() {
    const container = document.getElementById('projetos-container');
    if (!container) return;
    try {
        const response = await fetch('http://127.0.0.1:8000/api/projetos/');
        if (!response.ok) throw new Error('Falha ao buscar projetos');
        const projetos = await response.json();
        
        container.innerHTML = '';
        if (projetos.length === 0) {
            container.innerHTML = '<p>Nenhum projeto em andamento.</p>';
            return;
        }

        projetos.forEach(proj => {
            const cardHTML = `<div class="projeto-card" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${proj.imagem_url || ''}')"><h3 class="projeto-titulo">${proj.titulo}</h3><p class="projeto-descricao">${proj.descricao}</p><div class="progresso"><div class="barra-progresso" style="width: ${proj.progresso || 0}%;"></div></div><span>${proj.progresso || 0}% concluído</span><button class="projeto-detalhes" data-titulo="${proj.titulo}" data-descricao="${proj.descricao_detalhada || proj.descricao}" data-progresso="${proj.progresso || 0}" data-tarefas="${proj.tarefas || ''}">Ver Detalhes</button></div>`;
            container.innerHTML += cardHTML;
        });
        
        // Ativa os botões e configura o foco
        ativarLogicaModalProjetos();
    } catch (error) {
        console.error("Erro ao carregar projetos:", error);
    }
}

// --- FUNÇÃO PARA O CALENDÁRIO INTERATIVO ---
async function carregarEventosDoCalendario() {
    const calendarEl = document.getElementById('meu-calendario-container');
    if (!calendarEl) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            calendarEl.innerHTML = '<p>Faça login para ver seu calendário.</p>';
            return;
        }
        const response = await fetch('http://127.0.0.1:8000/api/calendar-events/', {
            headers: { 'Authorization': `Bearer ${session.provider_token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar eventos do calendário');
        const googleEvents = await response.json();
        
        const fullCalendarEvents = googleEvents.map(event => ({
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            url: event.htmlLink,
        }));

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', locale: 'pt-br',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
            buttonText: { today: 'Hoje', month: 'Mês', week: 'Semana', list: 'Lista' },
            events: fullCalendarEvents,
            eventClick: function(info) {
                info.jsEvent.preventDefault();
                if (info.event.url) window.open(info.event.url, "_blank");
            }
        });
        calendar.render();
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        calendarEl.innerHTML = '<p style="color:red;">Não foi possível carregar o calendário.</p>';
    }
}

// --- PONTO DE PARTIDA: CHAMA TODAS AS FUNÇÕES ---
carregarAniversariantes();
carregarProjetos();
carregarEventosDoCalendario();