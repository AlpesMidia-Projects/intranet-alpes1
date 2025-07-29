# Em api/authentication.py

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from api.utils import supabase_backend_client # Vamos criar este arquivo a seguir
import jwt

# Pegamos o segredo JWT das variáveis de ambiente
import os
from dotenv import load_dotenv
load_dotenv()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None # Nenhuma tentativa de autenticação

        token = auth_header.split(' ')[1]
        
        try:
            # Decodifica o token usando o segredo JWT para verificar a assinatura
            decoded_token = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            # Pega o email do usuário de dentro do token decodificado
            user_email = decoded_token.get('email')
            if not user_email:
                raise AuthenticationFailed('Token inválido: email não encontrado.')

            # Procura ou cria um usuário no Django com base no email
            user, created = User.objects.get_or_create(
                username=user_email,
                defaults={'email': user_email}
            )

            # Se o usuário foi criado agora, podemos preencher com mais dados
            if created:
                user_metadata = decoded_token.get('user_metadata', {})
                user.first_name = user_metadata.get('full_name', '').split(' ')[0]
                user.save()
            
            return (user, None)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado.')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Token inválido: {e}')
        except Exception as e:
            # Pega o usuário do Supabase para verificar se o token é válido
            try:
                if supabase_backend_client:
                    supabase_user = supabase_backend_client.auth.get_user(token)
                    user, _ = User.objects.get_or_create(username=supabase_user.user.email, defaults={'email': supabase_user.user.email})
                    return (user, None)
                else:
                    raise AuthenticationFailed('Cliente Supabase não inicializado.')
            except Exception as supabase_error:
                raise AuthenticationFailed(f'Erro de autenticação com Supabase: {supabase_error}')