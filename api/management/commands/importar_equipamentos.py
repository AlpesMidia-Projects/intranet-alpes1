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

        # Usamos um set para garantir que não vamos criar equipamentos duplicados
        equipamentos_existentes = set(Equipamento.objects.values_list('nome', flat=True))

        with open(caminho_arquivo, 'r', encoding='utf-8') as file:
            # Usamos DictReader para ler o CSV como um dicionário
            reader = csv.DictReader(file)
            
            for row in reader:
                # Remove espaços extras dos nomes das colunas e dos valores
                row = {k.strip(): v.strip() for k, v in row.items()}

                nome_pc = row.get('NOME PC')

                # Pula a linha se o nome do PC já existir no banco
                if nome_pc in equipamentos_existentes:
                    self.stdout.write(self.style.WARNING(f"Equipamento '{nome_pc}' já existe. Pulando."))
                    continue
                
                # Pula a linha se não houver nome
                if not nome_pc:
                    continue

                # --- Lógica para encontrar o responsável ---
                responsavel = None
                nome_usuario = row.get('USUARIO')
                if nome_usuario:
                    try:
                        # Procura pelo nome exato, ignorando maiúsculas/minúsculas
                        responsavel = Funcionario.objects.get(nome__iexact=nome_usuario)
                    except Funcionario.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Funcionário '{nome_usuario}' não encontrado. O equipamento será salvo sem responsável."))
                    except Funcionario.MultipleObjectsReturned:
                        self.stdout.write(self.style.ERROR(f"Múltiplos funcionários com o nome '{nome_usuario}'. O equipamento será salvo sem responsável."))

                # --- Lógica para converter a data ---
                data_formatacao = row.get('DATA FORMATAÇÃO')
                data_obj = None
                if data_formatacao:
                    try:
                        # Converte a data de DD/MM/AAAA para o formato do Django
                        data_obj = datetime.strptime(data_formatacao, '%d/%m/%Y').date()
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f"Formato de data inválido para '{nome_pc}': '{data_formatacao}'. O campo de data ficará nulo."))
                        # Se a data é obrigatória no modelo, você pode querer pular a linha
                        continue # Pula para a próxima linha se a data for inválida

                # Cria o equipamento no banco de dados
                Equipamento.objects.create(
                    nome=nome_pc,
                    tipo=(row.get('TIPO') or 'OUTRO').upper(),
                    numero_de_serie=row.get('PROCESSADOR'), # Usando 'PROCESSADOR' como exemplo para S/N
                    data_de_aquisicao=data_obj,
                    responsavel=responsavel
                )
                self.stdout.write(f"Equipamento '{nome_pc}' criado com sucesso.")

        self.stdout.write(self.style.SUCCESS('Importação concluída!'))