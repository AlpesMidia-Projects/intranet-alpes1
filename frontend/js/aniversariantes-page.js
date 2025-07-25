// js/aniversariantes-page.js
import { API_BASE_URL } from './config.js';

async function carregarAniversariantesDoMes() {
    const wrapper = document.getElementById('aniversariantes-swiper-wrapper');
    if (!wrapper) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/equipe/`);
        if (!response.ok) throw new Error('Falha ao buscar funcionários');
        const funcionarios = await response.json();

        const mesAtual = new Date().getMonth();
        const aniversariantes = funcionarios.filter(func => {
            if (!func.aniversario) return false;
            const partesData = func.aniversario.split('-');
            const mesAniversario = parseInt(partesData[1], 10) - 1;
            return mesAniversario === mesAtual;
        });

        wrapper.innerHTML = '';
        if (aniversariantes.length === 0) {
            wrapper.innerHTML = '<p>Nenhum aniversariante para exibir este mês.</p>';
            return;
        }
        
        aniversariantes.sort((a, b) => {
            const diaA = parseInt(a.aniversario.split('-')[2], 10);
            const diaB = parseInt(b.aniversario.split('-')[2], 10);
            return diaA - diaB;
        });

        aniversariantes.forEach(func => {
            const partesData = func.aniversario.split('-');
            const dia = partesData[2];
            
            // ATUALIZE AS CLASSES NESTE BLOCO
            const slideHTML = `
                <div class="swiper-slide">
                    <div class="card-aniv-pagina">
                        <div class="foto">
                            <img src="${func.imagem_url || 'imagens/avatar-padrao.png'}" alt="Foto de ${func.nome}">
                        </div>
                        <h3 class="nome">${func.nome}</h3>
                        <p class="cargo">${func.cargo || ''}</p>
                        <p class="dia">Dia ${dia}</p>
                    </div>
                </div>
                `;
            wrapper.innerHTML += slideHTML;
        });

        // Inicializa o Swiper depois de adicionar os slides
        new Swiper('.aniversariantes-swiper', {
            loop: false,
            slidesPerView: 1,
            spaceBetween: 30,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
            }
        });

    } catch (error) {
        console.error("Erro ao carregar aniversariantes:", error);
        wrapper.innerHTML = '<p style="color:red;">Erro ao carregar aniversariantes.</p>';
    }
}

// Inicia a função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarAniversariantesDoMes);