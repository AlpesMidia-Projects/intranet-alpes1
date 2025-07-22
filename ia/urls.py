from django.contrib import admin
from django.urls import path, include 
from api import views as api_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', api_views.health_check, name='health_check'),
]