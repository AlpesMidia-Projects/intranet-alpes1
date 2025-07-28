# api/management/commands/importar_equipamentos.py

import csv
from django.core.management.base import BaseCommand
from api.models import Equipamento, Funcionario
from datetime import datetime

class Command(BaseCommand):
    help = 'Importa equipamentos de um arquivo CSV específico da Alpes'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='O caminho para o arquivo CSV')

    def handle(self, *args, **options):
        caminho_arquivo = options['csv_file']
        self.stdout.write(self.style.SUCCESS(f'Iniciando importação de {caminho_arquivo}'))

        equipamentos_existentes = set(Equipamento.objects.values_list('nome', flat=True))

        with open(caminho_arquivo, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for i, row in enumerate(reader, 1): # Adiciona um contador de linha
                row = {k.strip(): v.strip() for k, v in row.items()}
                nome_pc = row.get('NOME PC')

                if not nome_pc:
                    continue

                if nome_pc in equipamentos_existentes:
                    self.stdout.write(self.style.WARNING(f"Linha {i}: Equipamento '{nome_pc}' já existe. Pulando."))
                    continue
                
                # --- LÓGICA DE DATA CORRIGIDA ---
                data_formatacao = row.get('DATA FORMATAÇÃO')
                data_obj = None
                if data_formatacao:
                    try:
                        data_obj = datetime.strptime(data_formatacao, '%d/%m/%Y').date()
                    except ValueError:
                        self.stdout.write(self.style.ERROR(f"Linha {i}: Formato de data inválido para '{nome_pc}': '{data_formatacao}'. Pulando esta linha."))
                        continue # Pula para a próxima linha
                else:
                    # Se a data estiver vazia, pula a linha e avisa
                    self.stdout.write(self.style.ERROR(f"Linha {i}: 'DATA FORMATAÇÃO' está vazia para '{nome_pc}'. Pulando esta linha."))
                    continue # Pula para a próxima linha

                # --- Lógica do responsável (continua igual) ---
                responsavel = None
                nome_usuario = row.get('USUARIO')
                if nome_usuario:
                    try:
                        responsavel = Funcionario.objects.get(nome__iexact=nome_usuario)
                    except Funcionario.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Linha {i}: Funcionário '{nome_usuario}' não encontrado."))
                    except Funcionario.MultipleObjectsReturned:
                        self.stdout.write(self.style.ERROR(f"Linha {i}: Múltiplos funcionários com o nome '{nome_usuario}'."))

                # Cria o equipamento no banco de dados
                Equipamento.objects.create(
                    nome=nome_pc,
                    tipo=(row.get('TIPO') or 'OUTRO').upper(),
                    numero_de_serie=row.get('NOME PC'),
                    data_de_aquisicao=data_obj,
                    responsavel=responsavel
                )
                self.stdout.write(f"Linha {i}: Equipamento '{nome_pc}' criado com sucesso.")

        self.stdout.write(self.style.SUCCESS('Importação concluída!'))