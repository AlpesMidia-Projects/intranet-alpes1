# serializers.py
from rest_framework import serializers
from .models import Funcionario, Projeto

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome', 'cargo', 'email', 'aniversario', 'imagem_url', 'departamento', 'telefone'] 

class ProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projeto
        fields = '__all__'