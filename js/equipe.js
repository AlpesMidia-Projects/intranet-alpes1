// js/equipe.js

export async function carregarFuncionarios() {
  const container = document.getElementById('equipe-container');
  if (!container) return;

  try {
    // 1. CHAMA A NOSSA NOVA API DO DJANGO
    const response = await fetch('http://127.0.0.1:8000/api/equipe/');

    if (!response.ok) {
      throw new Error(`Erro na rede: ${response.statusText}`);
    }

    // 2. PEGA OS DADOS EM FORMATO JSON
    const data = await response.json();
    
    container.innerHTML = '';

    // 3. CRIA OS CARDS COM OS DADOS VINDOS DA API DO DJANGO
    data.forEach(func => {
      // Limpa o telefone para usar no link do WhatsApp
      const telefoneLimpo = func.telefone ? func.telefone.replace(/\D/g, '') : '';

      const cardHTML = `
        <div class="employee-card">
          <div class="employee-photo">
            <img src="${func.imagem_url || 'imagens/avatar-padrao.png'}" alt="Foto de ${func.nome}" loading="lazy">
          </div>
          <div class="employee-info">
            <span class="employee-department">${func.departamento || ''}</span>
            <h3 class="employee-name">${func.nome}</h3>
            <p class="employee-contact">E-mail: ${func.email || ''}</p>
            <p class="employee-contact">Telefone: ${func.telefone || ''}</p>
            <a href="https://wa.me/55${telefoneLimpo}" class="whatsapp-button" target="_blank">Whatsapp</a>
          </div>
        </div>
      `;
      container.innerHTML += cardHTML;
    });

  } catch (error) {
    console.error('Falha ao carregar funcionários:', error);
    container.innerHTML = '<p>Não foi possível carregar a equipe. Tente novamente mais tarde.</p>';
  }
}