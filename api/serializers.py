# serializers.py
from rest_framework import serializers
from .models import Funcionario, Projeto, Noticia, Enquete, OpcaoEnquete

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome', 'cargo', 'email', 'aniversario', 'imagem_url', 'departamento', 'telefone'] 

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