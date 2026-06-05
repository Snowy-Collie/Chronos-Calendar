import os
import unittest
import json
from datetime import datetime, timedelta
from app import app, EVENTS_FILE, DATA_DIR, UPLOAD_DIR, perform_cleanup

class CalendarBackendTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Backup existing events.json if exists
        self.backup_exists = os.path.exists(EVENTS_FILE)
        self.events_backup = []
        if self.backup_exists:
            try:
                with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                    self.events_backup = json.load(f)
            except:
                pass
        
        # Clean state for tests
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

    def tearDown(self):
        # Restore backup if existed
        if self.backup_exists:
            with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.events_backup, f, ensure_ascii=False, indent=2)
        elif os.path.exists(EVENTS_FILE):
            os.remove(EVENTS_FILE)

    def test_create_valid_event(self):
        """Test creating an event with a valid date (e.g. tomorrow)"""
        tomorrow = datetime.now() + timedelta(days=1)
        time_str = tomorrow.strftime('%Y-%m-%d %H:%M:%S')
        
        payload = {
            "title": "Tomorrow Event",
            "time": time_str,
            "is_all_day": False,
            "countdown_enabled": True,
            "bg_color": "#ff0000"
        }
        
        response = self.client.post('/api/events', json=payload)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['title'], "Tomorrow Event")
        self.assertEqual(data['time'], time_str)
        self.assertIsNotNone(data['id'])

    def test_date_range_validation_future_error(self):
        """Test that event date cannot be > 2 years in the future"""
        too_far_future = datetime.now() + timedelta(days=2 * 365 + 10)
        time_str = too_far_future.strftime('%Y-%m-%d %H:%M:%S')
        
        payload = {
            "title": "Too Far Future",
            "time": time_str,
            "is_all_day": False
        }
        
        response = self.client.post('/api/events', json=payload)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)
        self.assertIn("2 years", data["error"])

    def test_date_range_validation_past_error(self):
        """Test that event date cannot be > 16 days in the past"""
        too_far_past = datetime.now() - timedelta(days=18)
        time_str = too_far_past.strftime('%Y-%m-%d %H:%M:%S')
        
        payload = {
            "title": "Too Far Past",
            "time": time_str,
            "is_all_day": False
        }
        
        response = self.client.post('/api/events', json=payload)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)
        self.assertIn("16 days", data["error"])

    def test_auto_cleanup(self):
        """Test that events older than 16 days are automatically deleted by the cleanup routine"""
        # Create an expired event manually in events.json
        expired_time = datetime.now() - timedelta(days=17)
        expired_event = {
            "id": "expired123",
            "title": "Expired Event",
            "time": expired_time.strftime('%Y-%m-%d %H:%M:%S'),
            "is_all_day": False,
            "countdown_enabled": True
        }
        
        # Create a valid event manually
        valid_time = datetime.now() + timedelta(days=5)
        valid_event = {
            "id": "valid123",
            "title": "Valid Event",
            "time": valid_time.strftime('%Y-%m-%d %H:%M:%S'),
            "is_all_day": False,
            "countdown_enabled": True
        }
        
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([expired_event, valid_event], f)
            
        # Trigger cleanup
        perform_cleanup()
        
        # Load and verify
        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            events_list = json.load(f)
            
        # The expired event should be deleted, only the valid one remains
        self.assertEqual(len(events_list), 1)
        self.assertEqual(events_list[0]['id'], "valid123")

    def test_poster_routes(self):
        """Test the poster rendering page and api generation endpoint"""
        tomorrow = datetime.now() + timedelta(days=1)
        time_str = tomorrow.strftime('%Y-%m-%d %H:%M:%S')
        event = {
            "id": "test_poster_event_id",
            "title": "Test Poster Event",
            "time": time_str,
            "is_all_day": False,
            "countdown_enabled": True,
            "card_effect": "glass",
            "card_color": "#ffffff",
            "card_opacity": 0.2
        }
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([event], f)
            
        # Test poster page route
        response = self.client.get('/poster/test_poster_event_id?lang=zh&format=desktop')
        self.assertEqual(response.status_code, 200)
        
        # Test generate_poster API route
        response = self.client.get('/api/generate_poster/test_poster_event_id?lang=zh&format=desktop')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, "image/png")

if __name__ == '__main__':
    unittest.main()
