import os
import uuid
import json
import urllib.request
from datetime import datetime, timedelta, date
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory, redirect, send_file, render_template
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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

FONT_DIR = os.path.join(DATA_DIR, 'fonts')
MEDIUM_FONT_PATH = os.path.join(FONT_DIR, 'Outfit-Medium.ttf')
BOLD_FONT_PATH = os.path.join(FONT_DIR, 'Outfit-Bold.ttf')

def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    medium_url = "https://raw.githubusercontent.com/Outfitio/Outfit-Fonts/main/fonts/ttf/Outfit-Medium.ttf"
    bold_url = "https://raw.githubusercontent.com/Outfitio/Outfit-Fonts/main/fonts/ttf/Outfit-Bold.ttf"
    
    if not os.path.exists(MEDIUM_FONT_PATH):
        try:
            print("Downloading Outfit-Medium font...")
            urllib.request.urlretrieve(medium_url, MEDIUM_FONT_PATH)
        except Exception as e:
            print(f"Error downloading medium font: {e}")
            
    if not os.path.exists(BOLD_FONT_PATH):
        try:
            print("Downloading Outfit-Bold font...")
            urllib.request.urlretrieve(bold_url, BOLD_FONT_PATH)
        except Exception as e:
            print(f"Error downloading bold font: {e}")

def load_font(lang, is_bold, size):
    # If language is English, try Outfit first
    if lang == 'en':
        font_path = BOLD_FONT_PATH if is_bold else MEDIUM_FONT_PATH
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                pass

    # For Chinese and Japanese, we need CJK support
    cjk_fonts = []
    if lang == 'ja':
        cjk_fonts = [
            "meiryo.ttc",     # Meiryo (Japanese)
            "msgothic.ttc",   # MS Gothic (Japanese)
            "yugoth.ttc",     # Yu Gothic (Japanese)
            "msyh.ttc"        # Microsoft YaHei
        ]
    else:  # 'zh' (Traditional Chinese, etc.)
        cjk_fonts = [
            "msjh.ttc",       # Microsoft JhengHei (Traditional Chinese)
            "msyh.ttc",       # Microsoft YaHei (Chinese)
            "simsun.ttc"      # SimSun
        ]
        
    fallback_list = cjk_fonts + ["arial.ttf", "msyh.ttc", "Calibri.ttf", "Helvetica.ttc"]
    
    for sys_font in fallback_list:
        try:
            return ImageFont.truetype(sys_font, size)
        except Exception:
            pass
            
    # Try Outfit as fallback
    font_path = BOLD_FONT_PATH if is_bold else MEDIUM_FONT_PATH
    if os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass

    return ImageFont.load_default()

def wrap_text(text, font, max_width):
    if not text:
        return []
        
    lines = []
    paragraphs = text.split('\n')
    
    for paragraph in paragraphs:
        if not paragraph:
            lines.append("")
            continue
            
        tokens = []
        current_token = ""
        
        for char in paragraph:
            # Check for CJK character ranges
            is_cjk = (0x3000 <= ord(char) <= 0x9FFF) or (0xFF00 <= ord(char) <= 0xFFEF)
            
            if is_cjk:
                if current_token:
                    tokens.append(current_token)
                    current_token = ""
                tokens.append(char)
            else:
                if char == ' ':
                    current_token += char
                else:
                    if current_token and current_token[-1] == ' ':
                        tokens.append(current_token)
                        current_token = char
                    else:
                        current_token += char
                        
        if current_token:
            tokens.append(current_token)
            
        current_line = ""
        for token in tokens:
            test_line = current_line + token
            bbox = font.getbbox(test_line)
            w = bbox[2] - bbox[0]
            
            if w <= max_width:
                current_line = test_line
            else:
                if not current_line:
                    lines.append(token)
                    current_line = ""
                else:
                    lines.append(current_line.rstrip())
                    test_bbox = font.getbbox(token)
                    token_w = test_bbox[2] - test_bbox[0]
                    if token_w > max_width:
                        sub_line = ""
                        for c in token:
                            test_sub = sub_line + c
                            sub_w = font.getbbox(test_sub)[2] - font.getbbox(test_sub)[0]
                            if sub_w <= max_width:
                                sub_line = test_sub
                            else:
                                lines.append(sub_line)
                                sub_line = c
                        current_line = sub_line
                    else:
                        current_line = token
                        
        if current_line:
            lines.append(current_line.rstrip())
            
    return lines

def detect_text_lang(text1, text2):
    combined = text1 + " " + text2
    has_cjk = False
    has_kana = False
    
    for char in combined:
        val = ord(char)
        if (0x3000 <= val <= 0x9FFF) or (0xFF00 <= val <= 0xFFEF):
            has_cjk = True
        if (0x3040 <= val <= 0x309F) or (0x30A0 <= val <= 0x30FF):
            has_kana = True
            
    if not has_cjk:
        return 'en'
    if has_kana:
        return 'ja'
    return 'zh'

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    if len(hex_str) == 6:
        return int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
    return 255, 255, 255

def calculate_remaining_time_py(target_time_str, is_all_day, display_units):
    now = datetime.now()
    
    if is_all_day:
        parts = target_time_str.split('-')
        target_date = datetime(int(parts[0]), int(parts[1]), int(parts[2]), 0, 0, 0)
    else:
        clean_str = target_time_str.replace('T', ' ')
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
            try:
                target_date = datetime.strptime(clean_str, fmt)
                break
            except ValueError:
                pass
        else:
            target_date = datetime.now()

    diff_td = target_date - now
    diff_ms = diff_td.total_seconds() * 1000

    status = 'future'
    if is_all_day:
        is_today = (now.year == target_date.year and 
                    now.month == target_date.month and 
                    now.day == target_date.day)
        if is_today:
            status = 'today'
        elif diff_ms < 0:
            status = 'past'
    else:
        is_same_day = (now.year == target_date.year and 
                       now.month == target_date.month and 
                       now.day == target_date.day)
        if is_same_day and abs(diff_ms) < 60000: # within 1 minute
            status = 'today'
        elif diff_ms < 0:
            status = 'past'

    ordered_units = ['y', 'd', 'h', 'm', 's']
    active_units = [u for u in ordered_units if u in display_units]
    if not active_units:
        active_units = ['d']

    result = {
        'y': 0,
        'd': 0,
        'h': 0,
        'm': 0,
        's': 0,
        'status': status,
        'totalDiffMs': diff_ms
    }

    has_time_units = 'h' in active_units or 'm' in active_units or 's' in active_units

    if not has_time_units:
        target_midnight = date(target_date.year, target_date.month, target_date.day)
        now_midnight = date(now.year, now.month, now.day)
        diff_days = (target_midnight - now_midnight).days
        abs_days = abs(diff_days)

        if 'y' in active_units and 'd' in active_units:
            result['y'] = abs_days // 365
            result['d'] = abs_days % 365
        elif 'y' in active_units:
            result['y'] = round(abs_days / 365)
        else:
            result['d'] = abs_days
    else:
        remaining_seconds = max(0, int(diff_ms / 1000))
        if diff_ms < 0:
            remaining_seconds = abs(int(diff_ms / 1000))

        unit_seconds = {
            'y': 365 * 24 * 60 * 60,
            'd': 24 * 60 * 60,
            'h': 60 * 60,
            'm': 60,
            's': 1
        }

        for i, unit in enumerate(active_units):
            unit_sec = unit_seconds[unit]
            if i == len(active_units) - 1:
                result[unit] = remaining_seconds // unit_sec
            else:
                result[unit] = remaining_seconds // unit_sec
                remaining_seconds = remaining_seconds % unit_sec

    return result

def parse_countdown_template_py(template, values):
    if not template:
        return ''
    
    result = ''
    i = 0
    while i < len(template):
        char = template[i]
        if char == '\\':
            if i + 1 < len(template):
                result += template[i + 1]
                i += 2
            else:
                result += '\\'
                i += 1
        elif char == '[':
            j = i + 1
            found = False
            while j < len(template):
                if template[j] == '\\':
                    j += 2
                elif template[j] == ']':
                    found = True
                    break
                else:
                    j += 1
            if found:
                tag = template[i + 1:j]
                if tag in values:
                    result += str(values[tag])
                else:
                    result += '[' + tag + ']'
                i = j + 1
            else:
                result += '['
                i += 1
        else:
            result += char
            i += 1
    return result

def get_countdown_string_py(event, lang):
    lang_templates = {
        'zh': {
            'defaultTemplate': "[title] 還有 [d] 天",
            'defaultTemplateToday': "[title] 就是今天！",
            'defaultTemplatePast': "[title] 已經過去 [d] 天",
        },
        'en': {
            'defaultTemplate': "[title] is in [d] days",
            'defaultTemplateToday': "[title] is today!",
            'defaultTemplatePast': "[title] passed [d] days ago",
        },
        'ja': {
            'defaultTemplate': "[title] まであと [d] 日",
            'defaultTemplateToday': "[title] は今日です！",
            'defaultTemplatePast': "[title] は [d] 日前に経過しました",
        }
    }

    t_dict = lang_templates.get(lang, lang_templates['en'])

    if not event.get('countdown_enabled', True):
        t_str = event.get('time', '')
        if event.get('is_all_day', False):
            return t_str
        else:
            return t_str.replace('T', ' ')

    display_units = event.get('display_units', ['y', 'd', 'h', 'm', 's'])
    time_data = calculate_remaining_time_py(event['time'], event.get('is_all_day', False), display_units)
    
    values = {
        'title': event['title'],
        'y': time_data['y'],
        'd': time_data['d'],
        'h': time_data['h'],
        'm': time_data['m'],
        's': time_data['s']
    }

    status = time_data['status']
    if status == 'today':
        return parse_countdown_template_py(t_dict['defaultTemplateToday'], values)
    elif status == 'past':
        return parse_countdown_template_py(t_dict['defaultTemplatePast'], values)
    else:
        user_template = event.get('template', '')
        if not user_template:
            user_template = t_dict['defaultTemplate']
        return parse_countdown_template_py(user_template, values)

@app.route('/poster/<event_id>')
def poster_page(event_id):
    events = load_events()
    event = next((e for e in events if str(e['id']) == event_id), None)
    if not event:
        return "Event not found", 404
        
    lang = request.args.get('lang', 'zh')
    format_type = request.args.get('format', 'desktop')
    
    texts = {
        'zh': {
            'title': '保存海報',
            'back': '返回',
            'tip_mobile': '長按上方圖片保存至相冊',
            'tip_desktop': '右鍵點擊上方圖片選擇「另存為」保存'
        },
        'en': {
            'title': 'Save Poster',
            'back': 'Back',
            'tip_mobile': 'Long press the image to save to your album',
            'tip_desktop': 'Right click the image and select "Save Image As"'
        },
        'ja': {
            'title': 'ポスターを保存',
            'back': '戻る',
            'tip_mobile': '画像を長押ししてアルバムに保存します',
            'tip_desktop': '画像を右クリックして「名前を付けて保存」を選択します'
        }
    }
    
    selected_texts = texts.get(lang, texts['en'])
    return render_template('poster.html', event_id=event_id, lang=lang, format=format_type, texts=selected_texts)

@app.route('/api/generate_poster/<event_id>')
def generate_poster(event_id):
    ensure_fonts()
    events = load_events()
    event = next((e for e in events if str(e['id']) == event_id), None)
    if not event:
        return "Event not found", 404

    lang = request.args.get('lang', 'zh')
    format_type = request.args.get('format', 'desktop')

    bg_image_url = event.get('bg_image')
    img = None
    w, h = 1920, 1080

    if bg_image_url:
        filename = bg_image_url.split('/')[-1]
        local_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(local_path):
            try:
                img = Image.open(local_path).convert('RGBA')
                w, h = img.size
                max_dim = 2000
                if w > max_dim or h > max_dim:
                    ratio = w / h
                    if w > h:
                        w = max_dim
                        h = int(max_dim / ratio)
                    else:
                        h = max_dim
                        w = int(max_dim * ratio)
                    img = img.resize((w, h), Image.Resampling.LANCZOS)
            except Exception as err:
                print(f"Error loading background image in python: {err}")
                img = None

    if not img:
        if format_type == 'mobile':
            w, h = 1080, 1920
        else:
            w, h = 1920, 1080
        img = Image.new('RGBA', (w, h), (30, 30, 46, 255))

    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    bg_color_hex = event.get('bg_color', '#1e1e2e')
    bg_opacity = event.get('bg_opacity', 1.0)
    r, g, b = hex_to_rgb(bg_color_hex)
    alpha = int(bg_opacity * 255)
    draw_overlay.rectangle([0, 0, w, h], fill=(r, g, b, alpha))
    img = Image.alpha_composite(img, overlay)

    is_landscape = w > h
    card_w = int(w * 0.42) if is_landscape else int(w * 0.80)
    base_card_w = 500 if is_landscape else 310
    scale = card_w / base_card_w

    title_text = event['title']
    countdown_text = get_countdown_string_py(event, lang)

    # Detect if actual text contains Chinese/Japanese characters and override font selection
    font_lang = detect_text_lang(title_text, countdown_text)

    title_size = int((24 if is_landscape else 20) * scale)
    countdown_size = int((48 if is_landscape else 35) * scale)
    font_title = load_font(font_lang, is_bold=False, size=title_size)
    font_countdown = load_font(font_lang, is_bold=True, size=countdown_size)

    # Calculate padding and text widths
    padding_y = int((60 if is_landscape else 50) * scale)
    padding_x = int((48 if is_landscape else 24) * scale)
    max_text_w = card_w - padding_x * 2

    # Wrap title and countdown text
    title_lines = wrap_text(title_text, font_title, max_text_w)
    countdown_lines = wrap_text(countdown_text, font_countdown, max_text_w)

    line_spacing = int(4 * scale)

    # Calculate title height
    title_line_h = 0
    for line in title_lines:
        bbox = font_title.getbbox(line if line else "Tg")
        h_line = bbox[3] - bbox[1]
        if h_line > title_line_h:
            title_line_h = h_line
    total_title_h = len(title_lines) * title_line_h + (len(title_lines) - 1) * line_spacing if title_lines else 0

    # Calculate countdown height
    countdown_line_h = 0
    for line in countdown_lines:
        bbox = font_countdown.getbbox(line if line else "Tg")
        h_line = bbox[3] - bbox[1]
        if h_line > countdown_line_h:
            countdown_line_h = h_line
    total_countdown_h = len(countdown_lines) * countdown_line_h + (len(countdown_lines) - 1) * line_spacing if countdown_lines else 0

    space_y = int((24 if is_landscape else 20) * scale)
    card_h = padding_y * 2 + total_title_h + space_y + total_countdown_h

    card_x1 = (w - card_w) // 2
    card_y1 = (h - card_h) // 2
    card_x2 = card_x1 + card_w
    card_y2 = card_y1 + card_h

    # Apply Gaussian Blur under the card region if card_effect is 'glass'
    card_radius = int((24 if is_landscape else 20) * scale)
    if event.get('card_effect', 'glass') == 'glass':
        x1 = max(0, card_x1)
        y1 = max(0, card_y1)
        x2 = min(w, card_x2)
        y2 = min(h, card_y2)
        if x2 > x1 and y2 > y1:
            card_crop = img.crop((x1, y1, x2, y2))
            blur_radius = max(2, int(25 * scale))
            blurred_crop = card_crop.filter(ImageFilter.GaussianBlur(radius=blur_radius))
            
            mask_w = x2 - x1
            mask_h = y2 - y1
            mask = Image.new('L', (mask_w, mask_h), 0)
            draw_mask = ImageDraw.Draw(mask)
            
            rx1 = card_x1 - x1
            ry1 = card_y1 - y1
            rx2 = card_x2 - x1
            ry2 = card_y2 - y1
            
            draw_mask.rounded_rectangle(
                [rx1, ry1, rx2, ry2],
                radius=card_radius,
                fill=255
            )
            img.paste(blurred_crop, (x1, y1), mask)

    card_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw_card = ImageDraw.Draw(card_layer)
    card_color_hex = event.get('card_color', '#ffffff')
    card_opacity = event.get('card_opacity', 0.05)
    cr, cg, cb = hex_to_rgb(card_color_hex)
    card_alpha = int(card_opacity * 255)
    border_width = max(1, int(1 * scale))

    draw_card.rounded_rectangle(
        [card_x1, card_y1, card_x2, card_y2],
        radius=card_radius,
        fill=(cr, cg, cb, card_alpha),
        outline=(255, 255, 255, 30),
        width=border_width
    )
    img = Image.alpha_composite(img, card_layer)

    text_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw_text = ImageDraw.Draw(text_layer)
    text_color_hex = event.get('text_color', '#ffffff')
    tr, tg, tb = hex_to_rgb(text_color_hex)

    # Draw title lines
    current_y = card_y1 + padding_y
    for line in title_lines:
        line_bbox = font_title.getbbox(line)
        line_w = line_bbox[2] - line_bbox[0]
        line_x = (w - line_w) // 2
        draw_text.text((line_x, current_y), line, fill=(tr, tg, tb, 255), font=font_title)
        current_y += title_line_h + line_spacing

    # Draw countdown lines
    current_y = card_y1 + padding_y + total_title_h + space_y
    for line in countdown_lines:
        line_bbox = font_countdown.getbbox(line)
        line_w = line_bbox[2] - line_bbox[0]
        line_x = (w - line_w) // 2
        draw_text.text((line_x, current_y), line, fill=(tr, tg, tb, 255), font=font_countdown)
        current_y += countdown_line_h + line_spacing

    img = Image.alpha_composite(img, text_layer)

    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    safe_title = "".join([c for c in event['title'] if c.isalnum() or c in (' ', '_', '-')]).rstrip()
    safe_title = safe_title.replace(' ', '_')
    if not safe_title:
        safe_title = "event"

    return send_file(
        img_io,
        mimetype='image/png',
        as_attachment=False,
        download_name=f"countdown-{safe_title}.png"
    )

if __name__ == '__main__':
    # Run server locally on port 5000, listening on all network interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)

