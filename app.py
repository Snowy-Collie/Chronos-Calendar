import os
import uuid
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, redirect

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuration
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
UPLOAD_DIR = os.path.join(DATA_DIR, 'uploads')
EVENTS_FILE = os.path.join(DATA_DIR, 'events.json')

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to load events
def load_events():
    if not os.path.exists(EVENTS_FILE):
        return []
    try:
        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading events: {e}")
        return []

# Helper function to save events
def save_events(events):
    try:
        with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving events: {e}")

# Helper function to check if User-Agent is mobile
def is_mobile_ua(user_agent):
    if not user_agent:
        return False
    ua = user_agent.lower()
    mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'opera mini', 'iemobile', 'webos', 'mobi']
    return any(keyword in ua for keyword in mobile_keywords)

# Auto-cleanup routine: delete events that passed more than 16 days ago
def perform_cleanup():
    events = load_events()
    now = datetime.now()
    cleaned_events = []
    changed = False

    for event in events:
        try:
            event_time_str = event.get('time')
            is_all_day = event.get('is_all_day', False)
            
            if is_all_day:
                # All-day format: YYYY-MM-DD
                event_dt = datetime.strptime(event_time_str, '%Y-%m-%d')
                # For all-day events, they expire 16 days after the day ends (so 17 days from start of the day)
                expiration_time = event_dt + timedelta(days=17)
            else:
                # Regular format: YYYY-MM-DDTHH:MM:SST (or similar ISO formats)
                # Let's support both T-separated and space-separated formats
                event_time_str = event_time_str.replace('T', ' ')
                if len(event_time_str) == 16:  # YYYY-MM-DD HH:MM
                    event_dt = datetime.strptime(event_time_str, '%Y-%m-%d %H:%M')
                else:  # YYYY-MM-DD HH:MM:SS
                    event_dt = datetime.strptime(event_time_str[:19], '%Y-%m-%d %H:%M:%S')
                expiration_time = event_dt + timedelta(days=16)

            if now > expiration_time:
                # Expired event: delete its background image if it exists locally
                bg_image = event.get('bg_image')
                if bg_image and bg_image.startswith('/uploads/'):
                    filename = bg_image.replace('/uploads/', '')
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    if os.path.exists(filepath):
                        try:
                            os.remove(filepath)
                            print(f"Deleted expired event background image: {filepath}")
                        except Exception as e:
                            print(f"Failed to delete background file: {e}")
                changed = True
                print(f"Auto-cleaned expired event: {event.get('title')} (Date: {event_time_str})")
            else:
                cleaned_events.append(event)
        except Exception as e:
            # Keep event if date parsing fails to prevent accidental data loss
            print(f"Error parsing date for cleanup of event {event.get('id')}: {e}")
            cleaned_events.append(event)
            
    if changed:
        save_events(cleaned_events)

# Routes
@app.route('/')
def index():
    user_agent = request.headers.get('User-Agent', '')
    if is_mobile_ua(user_agent):
        return redirect('/mobile')
    return send_from_directory('templates', 'desktop.html')

@app.route('/mobile')
def mobile():
    # Show mobile template
    return send_from_directory('templates', 'mobile.html')

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# API - Get all events (runs cleanup first)
@app.route('/api/events', methods=['GET'])
def get_events():
    perform_cleanup()
    return jsonify(load_events())

# API - Create or Update event
@app.route('/api/events', methods=['POST'])
def save_event():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = data.get('title', '').strip()
    event_time_str = data.get('time', '')
    is_all_day = data.get('is_all_day', False)

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not event_time_str:
        return jsonify({"error": "Time is required"}), 400

    # Validate range: from now - 16 days to now + 2 years
    try:
        now = datetime.now()
        if is_all_day:
            event_dt = datetime.strptime(event_time_str, '%Y-%m-%d')
            # For comparison, standard all day boundary
            lower_bound = now - timedelta(days=17) # Allow setting events up to 16 days ago
        else:
            time_clean = event_time_str.replace('T', ' ')
            if len(time_clean) == 16:
                event_dt = datetime.strptime(time_clean, '%Y-%m-%d %H:%M')
            else:
                event_dt = datetime.strptime(time_clean[:19], '%Y-%m-%d %H:%M:%S')
            lower_bound = now - timedelta(days=16)

        upper_bound = now + timedelta(days=2 * 365)

        if event_dt < lower_bound:
            return jsonify({"error": "Event date cannot be more than 16 days in the past"}), 400
        if event_dt > upper_bound:
            return jsonify({"error": "Event date cannot be more than 2 years in the future"}), 400
    except Exception as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400

    events = load_events()
    event_id = data.get('id')
    
    # Check if updating or creating
    existing_event = None
    if event_id:
        for e in events:
            if e.get('id') == event_id:
                existing_event = e
                break

    # If updating but not found, or creating a new one
    if not existing_event:
        event_id = uuid.uuid4().hex
        existing_event = {'id': event_id}
        events.append(existing_event)

    # Update fields
    existing_event['title'] = title
    existing_event['time'] = event_time_str
    existing_event['is_all_day'] = is_all_day
    existing_event['countdown_enabled'] = data.get('countdown_enabled', True)
    existing_event['bg_image'] = data.get('bg_image', None)
    existing_event['bg_effect'] = data.get('bg_effect', 'normal') # 'glass' or 'normal'
    existing_event['bg_opacity'] = float(data.get('bg_opacity', 1.0))
    existing_event['bg_color'] = data.get('bg_color', '#1e1e2e')
    existing_event['display_units'] = data.get('display_units', ['y', 'd', 'h', 'm', 's'])
    existing_event['template'] = data.get('template', '[title] 还有 [d] 天')
    existing_event['card_effect'] = data.get('card_effect', 'glass')
    existing_event['card_color'] = data.get('card_color', '#ffffff')
    existing_event['card_opacity'] = float(data.get('card_opacity', 0.05))
    existing_event['text_color'] = data.get('text_color', '#ffffff')

    save_events(events)
    return jsonify(existing_event)

# API - Delete event
@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    events = load_events()
    new_events = []
    deleted = False

    for e in events:
        if e.get('id') == event_id:
            # Delete associated file if it was uploaded
            bg_image = e.get('bg_image')
            if bg_image and bg_image.startswith('/uploads/'):
                filename = bg_image.replace('/uploads/', '')
                filepath = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as err:
                        print(f"Error removing upload file: {err}")
            deleted = True
        else:
            new_events.append(e)

    if deleted:
        save_events(new_events)
        return jsonify({"success": True})
    return jsonify({"error": "Event not found"}), 404

# API - Upload background image
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Check file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"}), 400

    # Save with unique random uuid filename
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)

    return jsonify({"url": f"/uploads/{filename}"})

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
