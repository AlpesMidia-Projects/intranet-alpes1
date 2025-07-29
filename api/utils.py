# Em api/utils.py

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_backend_client = None
try:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_SERVICE_KEY")
    supabase_backend_client: Client = create_client(url, key)
except Exception as e:
    print(f"❌ ERRO AO INICIALIZAR O CLIENTE SUPABASE: {e}")