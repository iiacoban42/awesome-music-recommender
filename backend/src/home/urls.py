"""API urls"""
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from . import views

urlpatterns = [
    path('', views.home, name='homepage'),
    path('get-new-track/<activity>/<context>/', views.get_new_track, name='get_new_track'),
    path('get-new-track/<activity>/', views.get_new_track, name='get_new_track'),
    path('get-new-playlist/', csrf_exempt(views.get_new_playlist), name='get_new_playlist'),
    path('get-dummy-playlist/', csrf_exempt(views.get_dummy_playlist), name='get_dummy_playlist'),
    path('get-yt-url/<track>/<artist>/', views.get_youtube_url, name='get_youtube_url'),

]
