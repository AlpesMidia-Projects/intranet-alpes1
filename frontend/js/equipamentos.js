// js/equipamentos.js
import { API_BASE_URL } from './config.js';

async function carregarEquipamentos() {
    const tbody = document.getElementById('equipamentos-tbody');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/equipamentos/`);

        if (response.status === 401) {
             tbody.innerHTML = '<tr><td colspan="4">Acesso negado. Por favor, faça o login.</td></tr>';
             return;
        }
        if (!response.ok) {
            throw new Error('Falha ao buscar equipamentos');
        }

        const equipamentos = await response.json();

        tbody.innerHTML = '';
        if (equipamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Nenhum equipamento encontrado.</td></tr>';
            return;
        }

        equipamentos.forEach(equip => {
            const row = `
                <tr>
                    <td>${equip.nome || ''}</td>
                    <td>${equip.tipo || ''}</td>
                    <td>${equip.numero_de_serie || 'N/A'}</td>
                    <td>${equip.responsavel_nome || 'Sem responsável'}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Erro ao carregar equipamentos:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Erro ao carregar equipamentos.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', carregarEquipamentos);