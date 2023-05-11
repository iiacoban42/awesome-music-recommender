"""API request handling. Map requests to the corresponding HTMLs."""
from django.shortcuts import render


def home(request):
    """Render index.html page"""
    ren = render(request, "home/index.html")
    return ren
