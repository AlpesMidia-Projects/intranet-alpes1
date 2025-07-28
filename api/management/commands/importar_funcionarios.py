# api/management/commands/importar_funcionarios.py

import csv
from django.core.management.base import BaseCommand
from api.models import Funcionario
from datetime import datetime

class Command(BaseCommand):
    help = 'Importa funcionários de um arquivo CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='O caminho para o arquivo CSV de funcionários')

    def handle(self, *args, **options):
        caminho_arquivo = options['csv_file']
        self.stdout.write(self.style.SUCCESS(f'Iniciando importação de funcionários de {caminho_arquivo}'))

        emails_existentes = set(Funcionario.objects.values_list('email', flat=True))

        with open(caminho_arquivo, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for i, row in enumerate(reader, 1):
                email = row.get('email')

                if not email or not email.strip():
                    self.stdout.write(self.style.WARNING(f"Linha {i}: E-mail não encontrado. Pulando."))
                    continue
                if email in emails_existentes:
                    self.stdout.write(self.style.WARNING(f"Linha {i}: E-mail '{email}' já existe. Pulando."))
                    continue

                data_aniversario = None
                aniversario_str = row.get('aniversario')
                if aniversario_str and aniversario_str.strip():
                    try:
                        data_completa_str = f"{aniversario_str}/2000"
                        data_aniversario = datetime.strptime(data_completa_str, '%d/%m/%Y').date()
                    except ValueError:
                        self.stdout.write(self.style.ERROR(f"Linha {i}: Formato de aniversário inválido para '{email}'. Deve ser DD/MM. Aniversário será deixado em branco."))
                
                Funcionario.objects.create(
                    nome=row.get('nome'),
                    email=email,
                    aniversario=data_aniversario,
                    departamento=row.get('departamento'),
                    telefone=row.get('telefone'),
                    imagem_url=row.get('imagem_url')
                )
                self.stdout.write(f"Linha {i}: Funcionário '{row.get('nome')}' criado com sucesso.")
                emails_existentes.add(email)

        self.stdout.write(self.style.SUCCESS('Importação de funcionários concluída!'))