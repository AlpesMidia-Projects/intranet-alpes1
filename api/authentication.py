# Em api/authentication.py

import jwt
import os
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from dotenv import load_dotenv

load_dotenv()

# Pega a URL do JWKS das variáveis de ambiente
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL")

class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None # Nenhuma tentativa de autenticação

        token = auth_header.split(' ')[1]
        
        if not SUPABASE_JWKS_URL:
            raise AuthenticationFailed('Configuração do servidor incompleta: SUPABASE_JWKS_URL não definida.')

        try:
            # Cria um cliente que sabe como buscar a chave pública
            jwks_client = PyJWKClient(SUPABASE_JWKS_URL)
            # Pede ao cliente para encontrar a chave correta para este token
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            # Decodifica o token usando a chave pública encontrada
            decoded_token = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"], # Usa o algoritmo correto
                audience="authenticated",
                options={"verify_exp": True}
            )

            user_email = decoded_token.get('email')
            if not user_email:
                raise AuthenticationFailed('Token inválido: email não encontrado.')

            # Procura ou cria um usuário no Django com base no email
            user, _ = User.objects.get_or_create(
                username=user_email,
                defaults={'email': user_email}
            )
            return (user, None)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado.')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Token JWT inválido: {e}')
        except Exception as e:
            raise AuthenticationFailed(f'Erro inesperado na autenticação: {e}')