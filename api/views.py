# api/views.py

from django.utils import timezone
import os
import json
import uuid 
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from supabase import create_client, Client 
from datetime import datetime
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Funcionario, Projeto
from .serializers import FuncionarioSerializer, ProjetoSerializer
from datetime import datetime
from .models import Noticia
from .serializers import NoticiaSerializer
from django.db.models import F

load_dotenv()

try:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    openai_client = None

try:
    elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
except Exception as e:
    elevenlabs_client = None

try:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_SERVICE_KEY")
    supabase_backend_client: Client = create_client(url, key)
except Exception as e:
    supabase_backend_client = None
    print(f"❌ ERRO AO INICIALIZAR O CLIENTE SUPABASE NO BACKEND: {e}")


@csrf_exempt
@require_POST
def gerar_texto_chatgpt(request):
    if not openai_client:
        return JsonResponse({'error': 'Chave da API da OpenAI não configurada no servidor.'}, status=503)
    
    try:
        body = json.loads(request.body)
        messages = body.get('messages') 

        if not messages:
            return JsonResponse({'error': 'O campo "messages" é obrigatório.'}, status=400)

        # Faz a chamada para a API do ChatGPT passando o histórico
        completion = openai_client.chat.completions.create(
          model="gpt-3.5-turbo",
          messages=messages
        )
        
        resposta_da_ia = completion.choices[0].message.content
        return JsonResponse({'resposta': resposta_da_ia})

    except Exception as e:
        print(f"❌ ERRO NA VIEW DO CHATGPT: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def gerar_audio_elevenlabs(request):
    if not elevenlabs_client or not supabase_backend_client:
        return JsonResponse({'error': 'Serviços de IA ou Banco de Dados não configurados no servidor.'}, status=503)

    try:
        body = json.loads(request.body)
        texto_para_audio = body.get('texto')
        voz_id = body.get('voz')
        audio_data = b"".join(elevenlabs_client.text_to_speech.convert(
            voice_id=voz_id,
            text=texto_para_audio,
            model_id="eleven_multilingual_v2"
        ))
        
        # 2. Salva o áudio no Supabase Storage
        nome_arquivo = f"public/audio_{uuid.uuid4()}.mp3"
        supabase_backend_client.storage.from_("audiosgerados").upload(
            path=nome_arquivo,
            file=audio_data,
            file_options={"content-type": "audio/mpeg"}
        )
        public_url = supabase_backend_client.storage.from_("audiosgerados").get_public_url(nome_arquivo)

        # 3. Grava o registro no banco de dados e PEGA O RESULTADO
        response = supabase_backend_client.table("historico_audios").insert({
            "texto_original": texto_para_audio,
            "voz_usada": voz_id,
            "audio_url": public_url,
        }).execute()
        
        # Pega o registro que acabamos de criar
        novo_registro_historico = response.data[0]
        
        print("✅ Áudio gerado e histórico salvo com sucesso!")
        
        # 4. RETORNA OS DADOS DO NOVO REGISTRO PARA O FRONT-END
        return JsonResponse(novo_registro_historico)

    except Exception as e:
        print(f"❌ ERRO NA API ELEVENLABS OU AO SALVAR: {e}")
        return JsonResponse({'error': str(e)}, status=500)
    
# --- NOVA VIEW PARA BUSCAR O HISTÓRICO DE ÁUDIOS ---
def get_historico_audios(request):
    # Garante que só aceitamos requisições GET
    if request.method == 'GET':
        try:
            # Busca todos os dados da tabela, ordenando pelos mais recentes primeiro
            response = supabase_backend_client.table("historico_audios").select("*").order("created_at", desc=True).execute()
            
            # A biblioteca do Supabase para Python retorna os dados dentro de um atributo 'data'
            return JsonResponse(response.data, safe=False)

        except Exception as e:
            print(f"❌ ERRO AO BUSCAR HISTÓRICO: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Método não permitido.'}, status=405)

@api_view(['GET'])
def get_aniversariantes_do_mes(request):
    try:
        mes_atual = datetime.now().month
        # Usando o ORM do Django para filtrar pelo mês do campo 'aniversario'
        aniversariantes = Funcionario.objects.filter(aniversario__month=mes_atual)
        # Usando o serializer para converter os dados para JSON
        serializer = FuncionarioSerializer(aniversariantes, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"❌ ERRO AO BUSCAR ANIVERSARIANTES COM DJANGO: {e}")
        return Response({'error': str(e)}, status=500)
    

# --- NOVA VIEW PARA BUSCAR OS PROJETOS ---
@api_view(['GET'])
def get_projetos(request):
    try:
        # Usando o ORM do Django para buscar todos os projetos
        projetos = Projeto.objects.all().order_by('-id')
        # Usando o serializer para converter os dados
        serializer = ProjetoSerializer(projetos, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"❌ ERRO AO BUSCAR PROJETOS COM DJANGO: {e}")
        return Response({'error': str(e)}, status=500)

@csrf_exempt
def get_google_calendar_events(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Apenas o método GET é permitido.'}, status=405)
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Token de acesso não fornecido.'}, status=401)
        
        access_token = auth_header.split(' ')[1]
        credentials = Credentials(token=access_token)
        
        # A função 'build' agora será encontrada
        service = build('calendar', 'v3', credentials=credentials)

        now = datetime.utcnow().isoformat() + 'Z'
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        return JsonResponse(events, safe=False)

    except Exception as e:
        print(f"❌ ERRO AO BUSCAR EVENTOS DO CALENDAR: {e}")
        return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['GET'])
def get_funcionarios(request):
    """
    Retorna uma lista de TODOS os funcionários.
    """
    try:
        funcionarios = Funcionario.objects.all().order_by('nome')
        serializer = FuncionarioSerializer(funcionarios, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"❌ ERRO AO BUSCAR TODOS OS FUNCIONÁRIOS: {e}")
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def get_noticias_ativas(request):
    """
    Retorna uma lista de notícias que estão dentro do período de publicação.
    """
    hoje = timezone.now()
    # Filtra notícias cuja data de início já passou e a data de fim ainda não chegou (ou é nula)
    noticias = Noticia.objects.filter(
        data_inicio_publicacao__lte=hoje
    ).exclude(
        data_fim_publicacao__lt=hoje
    )
    serializer = NoticiaSerializer(noticias, many=True)
    return Response(serializer.data)

from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "message": "Django está respondendo!"})

@api_view(['GET'])
def get_noticias_recentes(request):
    """
    Retorna as 4 notícias mais recentes que estão ativas.
    """
    hoje = timezone.now()
    noticias = Noticia.objects.filter(
        data_inicio_publicacao__lte=hoje
    ).exclude(
        data_fim_publicacao__lt=hoje
    ).order_by('-data_publicacao')[:4] # Ordena pela mais nova e pega as 4 primeiras

    serializer = NoticiaSerializer(noticias, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_enquete_ativa(request):
    """
    Busca a primeira enquete marcada como 'ativa' no banco de dados.
    """
    try:
        # Pega a primeira enquete que encontrar com ativa=True
        enquete = Enquete.objects.filter(ativa=True).first()
        if enquete:
            serializer = EnqueteSerializer(enquete)
            return Response(serializer.data)
        # Se não encontrar nenhuma, retorna uma resposta vazia
        return Response({})
    except Enquete.DoesNotExist:
        return Response({})

@api_view(['POST'])
def votar_enquete(request, pk):
    """
    Recebe um voto para uma opção de enquete específica.
    'pk' é o ID da opção que foi votada.
    """
    # Garante que a opção existe, senão retorna erro 404
    opcao = get_object_or_404(OpcaoEnquete, pk=pk)
    
    # Incrementa o voto de forma segura, evitando 'race conditions'
    opcao.votos = F('votos') + 1
    opcao.save()
    
    # Retorna uma mensagem de sucesso
    return Response({'status': 'voto computado'})