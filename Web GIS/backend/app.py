from flask import Flask, jsonify
import psycopg2
import json
from flask_cors import CORS
from config import DB_PARAMS
from flask import render_template
import os
from flask import request

app = Flask(__name__, template_folder=os.path.join(os.getcwd(), 'templates'))
CORS(app)

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        return f"Error rendering template: {e}"

@app.route('/select')
def select_page():
    return render_template('booking.html')

@app.route('/map')
def map_page():
    return render_template('index.html')


# ---- Function to Connect to the Database ----
def get_db_connection():
    # This function opens a new connection using the credentials from DB_PARAMS
    return psycopg2.connect(**DB_PARAMS)

# ---- Define API Route to Fetch Asset Data as GeoJSON ----
@app.route('/assets')
def get_assets():
    # Get a connection to the DB and open a cursor to execute queries
    conn = get_db_connection()
    cur = conn.cursor()

    # SQL query:
    # - Select id, name, type, timestamp
    # - Convert geometry to GeoJSON format using ST_AsGeoJSON (PostGIS function)
    cur.execute("""
        SELECT id, name, asset_type, last_seen, ST_AsGeoJSON(geom) as geojson
        FROM assets;
    """)

    features = []
    for row in cur.fetchall():
        id, name, asset_type, last_seen, geojson = row
        feature = {
            "type": "Feature",
            "geometry": json.loads(geojson),
            "properties": {
                "id": id,
                "name": name,
                "asset_type": asset_type,
                "last_seen": last_seen.strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Close the database connection
    cur.close()
    conn.close()

    # Return the GeoJSON to the frontend as a JSON response
    return jsonify(geojson)

@app.route('/nearest_asset', methods=['POST'])
def get_nearest_asset():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')

    if lat is None or lon is None:
        return jsonify({'error': 'Missing lat/lon'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, asset_type, last_seen, ST_AsGeoJSON(geom), 
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) as distance
        FROM assets
        WHERE asset_type = 'vehicle'
        ORDER BY distance ASC
        LIMIT 1;
    """, (lon, lat))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if row:
        id, name, asset_type, last_seen, geojson, distance = row
        return jsonify({
            "id": id,
            "name": name,
            "asset_type": asset_type,
            "last_seen": last_seen.strftime("%Y-%m-%d %H:%M:%S"),
            "geometry": json.loads(geojson),
            "distance_meters": round(distance, 2)
        })
    else:
        return jsonify({'error': 'No assets found'}), 404
    
# ---- Main Application Entry Point ----
if __name__ == '__main__':
    # Run the app in debug mode (useful for development; shows errors in browser)
    app.run(debug=True)