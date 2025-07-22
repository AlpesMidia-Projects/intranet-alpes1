import { API_BASE_URL } from './config.js'; 

document.addEventListener('DOMContentLoaded', function() {
    
const accordionHeaders = document.querySelectorAll(".accordion-header");

accordionHeaders.forEach(header => {
    header.addEventListener("click", function() {
        // Verifica se o painel que foi clicado já estava ativo
        const isActive = this.classList.contains('active');

        // Primeiro, fecha TODOS os painéis para garantir um estado limpo
        accordionHeaders.forEach(otherHeader => {
            otherHeader.classList.remove('active');
            if (otherHeader.nextElementSibling) {
                otherHeader.nextElementSibling.style.maxHeight = null;
            }
        });

        // Se o painel que você clicou NÃO estava ativo, então nós o abrimos.
        // Se ele já estava ativo, ele permanecerá fechado por causa do passo anterior.
        if (!isActive) {
            this.classList.add("active");
            const panel = this.nextElementSibling;
            if (panel) {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        }
    });
});

    // =======================================================
    // LÓGICA DO CHAT (CHATGPT)
    // =======================================================
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        let conversationHistory = [
            { role: 'system', content: 'Você é um assistente prestativo da intranet do Grupo Alpes.' }
        ];

        chatForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            addMessageToChat('user', userMessage);
            conversationHistory.push({ role: 'user', content: userMessage });
            chatInput.value = '';
            addMessageToChat('assistant', '...');

            try {
                const response = await fetch(`${API_BASE_URL}/api/gerar-texto/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversationHistory }) 
                });

                if (!response.ok) throw new Error('Erro na resposta do servidor.');
                
                const data = await response.json();
                
                chatMessages.removeChild(chatMessages.lastChild);
                addMessageToChat('assistant', data.resposta);
                conversationHistory.push({ role: 'assistant', content: data.resposta });

            } catch (error) {
                console.error('Erro no chat:', error);
                chatMessages.removeChild(chatMessages.lastChild);
                addMessageToChat('assistant', 'Ocorreu um erro. Tente novamente.');
            }
        });

        function addMessageToChat(role, text) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', role);
            const p = document.createElement('p');
            p.textContent = text;
            messageDiv.appendChild(p);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // =======================================================
    // LÓGICA DO GERADOR DE ÁUDIO (ELEVENLABS)
    // =======================================================
    const gerarAudioBtn = document.getElementById('gerar-audio-btn');
    if (gerarAudioBtn) {
        // Seleciona todos os elementos da ferramenta uma única vez
        const textoAudioInput = document.getElementById('texto-para-audio-input');
        const vozSelect = document.getElementById('voz-select');
        const audioResultadoContainer = document.getElementById('audio-resultado-container');
        const charCounter = document.getElementById('char-counter');
        const previewBtn = document.getElementById('preview-voice-btn');
        const previewPlayerContainer = document.getElementById('preview-player-container');
        const historyListContainer = document.getElementById('audio-history-list');
        let previewAudio; // Variável para controlar o áudio da prévia
        
        // --- FUNÇÃO PARA CARREGAR E EXIBIR O HISTÓRICO ---
        async function carregarHistoricoDeAudios() {
            if (!historyListContainer) return;
            historyListContainer.innerHTML = '<p>Carregando histórico...</p>';

            try {
                const response = await fetch(`${API_BASE_URL}/api/historico-audios/`,);
                if (!response.ok) throw new Error('Falha ao buscar histórico');

                const historico = await response.json();
                historyListContainer.innerHTML = ''; // Limpa a lista

                if (historico.length === 0) {
                    historyListContainer.innerHTML = '<p>Seu histórico de áudios está vazio.</p>';
                    return;
                }

                historico.forEach(item => {
                    const dataFormatada = new Date(item.created_at).toLocaleString('pt-BR');
                    const historyItemHTML = `
                        <div class="history-item">
                            <p class="history-item-text">"${item.texto_original}"</p>
                            <audio src="${item.audio_url}" controls></audio>
                            <span class="history-item-details">Voz: ${item.voz_usada} | Gerado em: ${dataFormatada}</span>
                        </div>
                    `;
                    historyListContainer.innerHTML += historyItemHTML;
                });

            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
                historyListContainer.innerHTML = '<p style="color: red;">Não foi possível carregar o histórico.</p>';
            }
        }

        // --- Lógica do contador de caracteres ---
        textoAudioInput.addEventListener('input', function() {
            const charCount = this.value.length;
            charCounter.textContent = `${charCount} / 2500`;
        });

        // --- Lógica para a PRÉVIA da voz com player ---
        previewBtn.addEventListener('click', function() {
            if (previewAudio && !previewAudio.paused) {
                previewAudio.pause();
                return;
            }
            const selectedVoiceId = vozSelect.value;
            const audioPath = `audio/previews/${selectedVoiceId}.mp3`;
            previewPlayerContainer.innerHTML = '';
            const audioPlayer = document.createElement('audio');
            audioPlayer.src = audioPath;
            audioPlayer.controls = true;
            previewPlayerContainer.appendChild(audioPlayer);
            previewAudio = audioPlayer;
            previewAudio.play().catch(error => {
                console.error("Erro ao tocar a prévia de áudio:", error);
                previewPlayerContainer.innerHTML = `<p style="font-size: 0.9em; color: red;">Não foi possível carregar a prévia.</p>`;
            });
        });

        // --- Lógica do botão de GERAR áudio ---
        gerarAudioBtn.addEventListener('click', async function() {
            const texto = textoAudioInput.value;
            const voz = vozSelect.value;

            if (!texto) {
                alert('Por favor, digite um texto para gerar o áudio.');
                return;
            }

            this.disabled = true;
            this.textContent = 'Gerando...';
            audioResultadoContainer.innerHTML = '';

            try {
                // A chamada fetch continua a mesma
                const response = await fetch(`${API_BASE_URL}/api/gerar-audio/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texto: texto, voz: voz })
                });

                // O backend agora retorna JSON com os dados do novo histórico
                const novoHistoricoItem = await response.json();

                if (!response.ok) {
                    throw new Error(novoHistoricoItem.error || 'Erro na resposta do servidor.');
                }
                
                // --- LÓGICA CORRIGIDA PARA EXIBIR O PLAYER IMEDIATO ---

                // 1. Limpa a área de resultado
                audioResultadoContainer.innerHTML = '';
                
                // 2. Cria o player de áudio usando a URL permanente retornada pelo backend
                const audioPlayer = document.createElement('audio');
                audioPlayer.src = novoHistoricoItem.audio_url; // << Usamos a URL permanente!
                audioPlayer.controls = true;
                audioPlayer.autoplay = true; // Faz o áudio tocar automaticamente
                audioResultadoContainer.appendChild(audioPlayer);

                // 3. ATUALIZAÇÃO EM TEMPO REAL DO HISTÓRICO
                // A forma mais simples é chamar a função que recarrega a lista
                console.log("Gerado com sucesso, atualizando histórico...");
                await carregarHistoricoDeAudios();

            } catch (error) {
                console.error('Erro:', error);
                audioResultadoContainer.innerHTML = `<p style="color: red;">Ocorreu um erro ao gerar o áudio: ${error.message}</p>`;

            } finally {
                // Reativa o botão e restaura o texto original
                this.disabled = false;
                this.textContent = 'Gerar Áudio';
            }
        });

        // --- CARREGA O HISTÓRICO INICIAL ---
        carregarHistoricoDeAudios();
    }
});