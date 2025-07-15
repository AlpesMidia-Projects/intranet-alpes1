// js/equipe.js

import { supabase } from '/js/supabaseClient.js';

export async function carregarFuncionarios() {
  const container = document.getElementById('equipe-container');
  if (!container) return; 

  // Pede todas as colunas da tabela
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*');

  if (error) {
    console.error('Erro ao buscar dados:', error);
    return;
  }

  container.innerHTML = ''; 
  
  // O loop agora usa a variável 'func' corretamente
  data.forEach(func => {
    // Limpa o número de telefone para criar o link do WhatsApp (remove espaços, traços, etc.)
    const telefoneLimpo = func.telefone ? func.telefone.replace(/\D/g, '') : '';
    
    // Cria a nova estrutura HTML para o card
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
}