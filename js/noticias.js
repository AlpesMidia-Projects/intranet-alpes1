// js/noticias.js
async function carregarNoticias() {
    const container = document.getElementById('noticias-container');
    if (!container) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/noticias/');
        const noticias = await response.json();
        container.innerHTML = '';
        noticias.forEach(noticia => {
            const data = new Date(noticia.data_publicacao).toLocaleDateString('pt-BR');
            const noticiaHTML = `
                <div class="noticia-card">
                    <img src="${noticia.imagem_destaque_url || 'https://via.placeholder.com/400x200'}" alt="">
                    <div class="noticia-content">
                        <h3>${noticia.titulo}</h3>
                        <p>${noticia.conteudo.substring(0, 150)}...</p>
                        <div class="noticia-meta">
                            <span>Por: ${noticia.autor_nome || 'Admin'}</span>
                            <span>${data}</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += noticiaHTML;
        });
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
    }
}
document.addEventListener('DOMContentLoaded', carregarNoticias);