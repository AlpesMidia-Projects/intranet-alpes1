# serializers.py
from rest_framework import serializers
from .models import Funcionario, Projeto, Noticia

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