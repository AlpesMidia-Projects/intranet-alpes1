# api/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # URLs para as ferramentas de IA
    path('gerar-texto/', views.gerar_texto_chatgpt, name='gerar_texto'),
    path('gerar-audio/', views.gerar_audio_elevenlabs, name='gerar_audio'),
    
    # URLs para buscar dados para o site
    path('aniversariantes/', views.get_aniversariantes_do_mes, name='get_aniversariantes'),
    path('projetos/', views.get_projetos, name='get_projetos'),
    path('calendar-events/', views.get_google_calendar_events, name='get_calendar_events'),
    path('historico-audios/', views.get_historico_audios, name='get_historico_audios'),
    path('equipe/', views.get_funcionarios, name='get_equipe'),
    path('noticias/', views.get_noticias_ativas, name='api-noticias'),
    path('noticias-recentes/', views.get_noticias_recentes, name='api-noticias-recentes'),
    path('enquete-ativa/', views.get_enquete_ativa, name='api-enquete-ativa'),
    path('opcoes/<int:pk>/votar/', views.votar_enquete, name='api-votar-enquete'),
]