from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import random

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

# print(get_youtube_url("Never Gonna Give You Up", "Rick Astley"))


def find_spotify_playlists(query: str, sp=None) -> list:
    if sp is None:
        scope = "playlist-read-private"
        sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope,
                                                   client_id=spotify_client_id,
                                                   client_secret=spotify_client_secret,
                                                   redirect_uri="http://localhost:8000"
                                                   )
                         )

    # Search for playlists
    results = sp.search(q=query, type='playlist', limit=1)

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
        genres = tuple(artist_info['genres'])

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


def merge_preferences(preferences_list: list, intersect: bool) -> set:
    if intersect:
        # Intersect genre preferences
        sets = [set(lst) for lst in preferences_list]
        merged_preferred_genres = set.intersection(*sets)
        return merged_preferred_genres

    # Union genre preferences
    sets = [set(lst) for lst in preferences_list]
    merged_preferred_genres = set.union(*sets)

    return merged_preferred_genres


def exclude_genres(preference_list: set, exclude_genres_lists: list) -> set:
    for lst in exclude_genres_lists:
        preference_list.difference_update(lst)

    return preference_list


def blend_playlist(context: str, preferences_list: list, exclude_genres_lists: list=[], intersect: bool=False, shuffle: bool=True) ->list:
    blended_playlist = []

    # Merge genre preferences of all users
    merged_preferred_genres = merge_preferences(preferences_list, intersect)
    if len(merged_preferred_genres) == 0:
        merged_preferred_genres = merge_preferences(preferences_list, False)

    # Exclude genres users don't want to listen to
    if exclude_genres_lists != [] or exclude_genres_lists is not None:
        merged_preferred_genres = exclude_genres(merged_preferred_genres, exclude_genres_lists)

    # Merge context specific playlists for each genre
    for genre in merged_preferred_genres:
        spotify_playlist = find_spotify_playlists(f"{genre} {context}")
        # Add playlist to the blended playlist
        blended_playlist.extend(spotify_playlist)

    # Remove duplicate tracks
    blended_playlist_set = set(blended_playlist)
    blended_spotify_playlist = list(blended_playlist_set)

    # shuffle merge playlist
    if shuffle:
        random.seed(42)
        random.shuffle(blended_spotify_playlist)

    # Return the new playlist
    return blended_spotify_playlist


def find_youtube_urls_of_spotify_playlist(spotify_playlist: list) -> list:
    youtube_urls_playlist = []

    # Save the youtube URL of each track
    for track, artist, genre in spotify_playlist:
        youtube_urls_playlist.append(get_youtube_url(track, artist))

    return youtube_urls_playlist


# blend = blend_playlist("study", [["rock"], ["pop"]], intersect=False)
# print(blend)
# yt_urls = find_youtube_urls_of_spotify_playlist(blend)
# print(yt_urls)


# tracks = find_spotify_playlists("lofi")
# print(tracks)