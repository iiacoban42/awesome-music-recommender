"""API urls"""
from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='homepage'),
    path('get-new-track/<activity>/<context>/', views.get_new_track, name='get_new_track'),
    path('get-new-track/<activity>/', views.get_new_track, name='get_new_track'),
    path('get-new-playlist/<context>/<preferences>/', views.get_new_playlist, name='get_new_playlist'),

]
