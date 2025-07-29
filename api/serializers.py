# api/serializers.py

from rest_framework import serializers
# ADICIONE O 'Equipamento' NA LINHA DE IMPORTAÇÃO
from .models import Funcionario, Projeto, Noticia, Enquete, OpcaoEnquete, Equipamento

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        # Garanta que todos os campos que você precisa estão aqui
        fields = ['id', 'nome', 'email', 'aniversario', 'imagem_url', 'setor', 'telefone']

class ProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projeto
        fields = '__all__'

class NoticiaSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source='autor.username', read_only=True)
    class Meta:
        model = Noticia
        fields = '__all__'

class OpcaoEnqueteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpcaoEnquete
        fields = ['id', 'texto_opcao', 'votos']

class EnqueteSerializer(serializers.ModelSerializer):
    opcoes = OpcaoEnqueteSerializer(many=True, read_only=True)
    class Meta:
        model = Enquete
        fields = ['id', 'pergunta', 'opcoes']

class EquipamentoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.SerializerMethodField()

    class Meta:
        model = Equipamento
        fields = [
            'id', 
            'nome', 
            'tipo', 
            'numero_de_serie', 
            'data_de_aquisicao', 
            'responsavel', 
            'responsavel_nome' 
        ]

    def get_responsavel_nome(self, obj):
        if obj.responsavel:
            return obj.responsavel.nome
        return "Sem responsável" # Retorna um texto padrão se não houver responsável