from googleapiclient.discovery import build
import os

# YouTube Data API key
youtube_api_key = os.environ.get('YOUTUBE_API_KEY', 'change_me')

def getYoutubeURL(song_title: str, artist_name: str) -> str:

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
