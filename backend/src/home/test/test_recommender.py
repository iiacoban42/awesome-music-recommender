from django.test import TestCase
from unittest.mock import patch

from ..recommender import exclude_genres, merge_preferences, exclude_genres, find_spotify_playlists

class TestUtils(TestCase):

    def test_find_spotify_playlists(self):
        # Mock the Spotify API call
        with patch('spotipy.oauth2.SpotifyOAuth') as mock_oauth:
            mock_spotify = mock_oauth.return_value
            mock_spotify.search.return_value = {
                'playlists': {'items': [{'uri': 'playlist_uri'}]}
            }
            mock_spotify.playlist_tracks.return_value = {
                'items': [
                    {'track': {'name': 'Track 1', 'artists': [{'name': 'Artist 1', 'id': {'genres': 'genre 1'}}]}},
                    {'track': {'name': 'Track 2', 'artists': [{'name': 'Artist 2', 'id': {'genres': 'genre 2'}}]}}
                ]
            }


            mock_spotify.artist.return_value = {
                'genres': ['genre 1', 'genre 2']
            }

            playlists = find_spotify_playlists("lofi", mock_spotify)
            expected_playlists = [
                ('Track 1', 'Artist 1', ('genre 1', 'genre 2')),
                ('Track 2', 'Artist 2', ('genre 1', 'genre 2'))
            ]
            self.assertEqual(playlists, expected_playlists)

    def test_merge_preferences(self):
        preferences_list = [["genre1", "genre2"], ["genre2", "genre3"], ["genre2", "genre4"]]
        merged_genres = merge_preferences(preferences_list, intersect=True)
        expected_genres = {"genre2"}
        self.assertEqual(merged_genres, expected_genres)

        merged_genres = merge_preferences(preferences_list, intersect=False)
        expected_genres = {"genre1", "genre2", "genre3", "genre4"}
        self.assertEqual(merged_genres, expected_genres)

    def test_exclude_genres(self):
        preference_list = {"genre1", "genre2", "genre3", "genre4"}
        exclude_genres_lists = [["genre2", "genre3"], ["genre4"]]
        result = exclude_genres(preference_list, exclude_genres_lists)
        expected_result = {"genre1"}
        self.assertEqual(result, expected_result)
