# api/views.py

import os
import json
import uuid # Importa a biblioteca para gerar nomes únicos
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from supabase import create_client, Client # Importa o cliente Supabase
from datetime import datetime
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

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

def get_aniversariantes_do_mes(request):
    # Garante que só aceitamos requisições GET
    if request.method == 'GET':
        try:
            # Pega o número do mês atual (ex: 7 para Julho)
            mes_atual = datetime.now().month

            # Chama a função que criamos no Supabase para buscar os aniversariantes
            aniversariantes = supabase_backend_client.rpc('get_birthdays_for_month', {'month_num': mes_atual}).execute()

            # Retorna a lista de aniversariantes encontrada
            return JsonResponse(aniversariantes.data, safe=False)

        except Exception as e:
            print(f"❌ ERRO AO BUSCAR ANIVERSARIANTES: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Método não permitido.'}, status=405)

# --- NOVA VIEW PARA BUSCAR OS PROJETOS ---
def get_projetos(request):
    if request.method == 'GET':
        try:
            # Busca todos os dados da tabela 'projetos'
            response = supabase_backend_client.table("projetos").select("*").order("id", desc=True).execute()
            return JsonResponse(response.data, safe=False)
        except Exception as e:
            print(f"❌ ERRO AO BUSCAR PROJETOS: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Método não permitido.'}, status=405)

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