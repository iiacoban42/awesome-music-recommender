from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth

load_dotenv()

# YouTube Data API key
youtube_api_key = os.getenv('YOUTUBE_API_KEY')
spotify_client_id = os.getenv('SPOTIFY_CLIENT_ID')
spotify_client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')


def get_youtube_url(song_title: str, artist_name: str) -> str:

    # Initialize the YouTube Data API
    youtube = build('youtube', 'v3', developerKey=youtube_api_key)

    # Perform the search based on title and artist
    search_query = f"{song_title} {artist_name}"
    search_response = youtube.search().list(q=search_query, part='id', maxResults=1, type='video').execute()

    # Retrieve the video ID of the top search result
    video_id = search_response['items'][0]['id']['videoId']

    # Generate the YouTube URL
    youtube_url = f"https://www.youtube.com/watch?v={video_id}"

    # Print the YouTube URL
    return youtube_url

print(get_youtube_url("Never Gonna Give You Up", "Rick Astley"))


def find_spotify_playlists(query):
    # Define the scope of access for the Spotify API
    scope = "playlist-read-private"

    # Set up the Spotify API client
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope,
                                                   client_id=spotify_client_id,
                                                   client_secret=spotify_client_secret,
                                                   redirect_uri="http://localhost:8000"
                                                   )
                         )

    # Search for playlists
    results = sp.search(q=query, type='playlist', limit=5)

    # Retrieve the first playlist's URI
    playlist_uri = results['playlists']['items'][0]['uri']

    # Retrieve the playlist's tracks
    results = sp.playlist_tracks(playlist_uri)

    # Create an empty list to store the track, artist, and genres information
    playlist_info = []

    # Iterate over the playlist's tracks and retrieve the artist, track, and genres information
    for item in results['items']:
        track = item['track']
        artist = track['artists'][0]['name']
        track_name = track['name']

        # Retrieve the artist's information
        artist_info = sp.artist(track['artists'][0]['id'])
        genres = artist_info['genres']

        # Store the track, artist, and genres information in the list as a tuple
        playlist_info.append((track_name, artist, genres))

    # Print and return the list of tuples
    for track_info in playlist_info:
        track_name, artist, genres = track_info
        print("Track:", track_name)
        print("Artist:", artist)
        print("Genres:", ", ".join(genres))
        print()

    # Return the list of tuples
    return playlist_info

tracks = find_spotify_playlists("lofi")
print(tracks)
