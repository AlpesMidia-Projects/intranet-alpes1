from django.contrib import admin
from .models import Funcionario, Projeto, Noticia, Enquete, OpcaoEnquete, Equipamento

# Customização para o painel de Funcionários
@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cargo', 'email', 'aniversario')
    search_fields = ('nome', 'email', 'cargo')
    list_filter = ('cargo',)

# Customização para o painel de Projetos
@admin.register(Projeto)
class ProjetoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'progresso')
    search_fields = ('titulo',)
    list_filter = ('progresso',)

# Customização para o painel de Notícias
@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'data_publicacao')
    search_fields = ('titulo', 'autor__username')
    list_filter = ('data_publicacao', 'autor')
    autocomplete_fields = ('autor',) # Ajuda a procurar usuários se houver muitos

# Permite adicionar Opções diretamente na página da Enquete (muito útil!)
class OpcaoEnqueteInline(admin.TabularInline):
    model = OpcaoEnquete
    extra = 1 # Quantos campos de opção vazios aparecem por padrão

# Customização para o painel de Enquetes
@admin.register(Enquete)
class EnqueteAdmin(admin.ModelAdmin):
    list_display = ('pergunta', 'ativa', 'data_criacao')
    list_filter = ('ativa',)
    inlines = [OpcaoEnqueteInline] # Adiciona as opções na mesma tela

@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo', 'numero_de_serie', 'responsavel', 'data_de_aquisicao')
    list_filter = ('tipo', 'responsavel')
    search_fields = ('nome', 'numero_de_serie', 'responsavel__nome')
