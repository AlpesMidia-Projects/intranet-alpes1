# ia/urls.py

from django.contrib import admin
# A CORREÇÃO ESTÁ AQUI: Adicionamos 'include' à linha de importação
from django.urls import path, include 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Esta linha, que usa o 'include', agora funcionará corretamente
    path('api/', include('api.urls')),
]