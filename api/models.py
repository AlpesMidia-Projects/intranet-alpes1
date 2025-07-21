from django.db import models
from django.contrib.auth.models import User 
from django.utils import timezone

# Modelo para os Funcionários
class Funcionario(models.Model):
    nome = models.CharField(max_length=100)
    cargo = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    aniversario = models.DateField()
    imagem_url = models.URLField(max_length=200, blank=True, null=True, help_text="URL da imagem de perfil do funcionário.")
    departamento = models.CharField(max_length=100, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nome

    # Propriedade para pegar o mês de aniversário facilmente
    @property
    def mes_aniversario(self):
        return self.aniversario.month

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"


# Modelo para os Projetos
class Projeto(models.Model):
    titulo = models.CharField(max_length=150)
    descricao = models.TextField(help_text="Descrição curta que aparece no card.")
    descricao_detalhada = models.TextField(blank=True, null=True, help_text="Descrição completa para o modal de detalhes.")
    progresso = models.PositiveIntegerField(default=0, help_text="Progresso de 0 a 100.")
    imagem_url = models.URLField(max_length=200, blank=True, null=True, help_text="URL da imagem de fundo do projeto.")

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name = "Projeto"
        verbose_name_plural = "Projetos"


# --- Modelos para o Futuro ---

# Modelo para Notícias
class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    conteudo = models.TextField()
    data_publicacao = models.DateTimeField(default=timezone.now)
    autor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    imagem_destaque_url = models.URLField(max_length=200, blank=True, null=True)

    data_inicio_publicacao = models.DateTimeField(default=timezone.now, verbose_name="Início da Publicação")
    data_fim_publicacao = models.DateTimeField(null=True, blank=True, verbose_name="Fim da Publicação")

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name = "Notícia"
        verbose_name_plural = "Notícias"
        ordering = ['-data_publicacao'] # Ordena da mais nova para a mais antiga


# Modelo para Enquetes (exemplo simples)
class Enquete(models.Model):
    pergunta = models.CharField(max_length=255)
    ativa = models.BooleanField(default=True, help_text="Marque se esta é a enquete ativa da semana.")
    data_criacao = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.pergunta

    class Meta:
        verbose_name = "Enquete"
        verbose_name_plural = "Enquetes"


class OpcaoEnquete(models.Model):
    enquete = models.ForeignKey(Enquete, related_name='opcoes', on_delete=models.CASCADE)
    texto_opcao = models.CharField(max_length=100)
    votos = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.enquete.pergunta} - {self.texto_opcao}"