"""API request handling. Map requests to the corresponding HTMLs."""
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import render
import json
import os
import pickle

from .recommender import blend_playlist, get_youtube_url, blend_playlist_local


def home(request):
    """Render index.html page"""
    ren = render(request, "home/index.html")
    return ren


def recommend_chitchat_music(context=None):
    """Recommend chitchat background playlist"""
    lofi_girl_live = "https://www.youtube.com/watch?v=jfKfPfyJRdk"

    return {"url": lofi_girl_live}


def recommend_study_music(context=None):
    """Recommend study background playlist"""
    lofi_girl_live = "https://www.youtube.com/watch?v=jfKfPfyJRdk"

    return {"url": lofi_girl_live}


def recommend_gaming_music(context=None):
    """Recommend gaming background playlist"""

    gaming_lofi = "https://www.youtube.com/watch?v=FFfdyV8gnWk"
    fps_tactical_music =  "https://www.youtube.com/watch?v=bNZH3pQjClU"
    match context:
        case "fps":
            return {"url": fps_tactical_music}
        case "party":
            return {"url": gaming_lofi}
        case _:
            return {"url": gaming_lofi}


def get_new_track(request, activity, context=None):
    """Recommend gaming background playlist"""
    match activity:
        case "just chatting":
            return  JsonResponse(recommend_chitchat_music(context))
        case "studying":
            return  JsonResponse(recommend_study_music(context))
        case "gaming":
            return  JsonResponse(recommend_gaming_music(context))
        case _:
            return HttpResponseBadRequest()


def get_new_playlist(request):
    """Create new playlist based on genres and context"""

    json_input = json.loads(request.body)
    context = json_input['context']
    preferences = json_input['likes']
    exclude_genres = json_input['dislikes']

    blend = blend_playlist_local(context, preferences, exclude_genres)

    return JsonResponse({"playlist_blend": blend})

def get_dummy_playlist(request):
    """Create new playlist based on genres and context"""

    json_input = json.loads(request.body)
    context = json_input['context']
    preferences = json_input['likes']
    exclude_genres = json_input['dislikes']

    cached_playlist_file_path = f'home/cached/Designing.pickle'
    # Check if the playlist is cached
    if os.path.exists(cached_playlist_file_path):
        with open(cached_playlist_file_path, 'rb') as file:
            blended_playlist = pickle.load(file)

    return JsonResponse({"playlist_blend": blended_playlist})



def get_track_youtube_url(request, track, artist):
    """Query the google API to find track on youtube"""
    url = get_youtube_url(track, artist)

    return JsonResponse({"url": url})
