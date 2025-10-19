import psycopg2
import time
import random
from config import DB_PARAMS  # Import dictionary of DB credentials

UPDATE_INTERVAL_SECONDS = 3  # Time between asset movements (in seconds)

print("Starting asset movement simulation...")

try:
    # Connect to PostgreSQL + PostGIS using unpacked parameters
    conn = psycopg2.connect(**DB_PARAMS)

    while True:
        cur = conn.cursor()
        try:
            # Get current asset IDs and their locations
            cur.execute("SELECT id, ST_X(geom), ST_Y(geom) FROM assets;")
            assets = cur.fetchall()

            if not assets:
                print("No assets found in the database.")

            for asset_id, lon, lat in assets:
                # Random small movement in lon/lat
                new_lon = lon + random.uniform(-0.0005, 0.0005)
                new_lat = lat + random.uniform(-0.0005, 0.0005)

                # Update location in DB
                cur.execute("""
                    UPDATE assets
                    SET geom = ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                        last_seen = NOW()
                    WHERE id = %s;
                """, (new_lon, new_lat, asset_id))

                print(f"Moved asset {asset_id} to ({new_lon:.5f}, {new_lat:.5f})")

            conn.commit()
            print(f"--- Committed. Sleeping {UPDATE_INTERVAL_SECONDS}s ---")

        except Exception as e:
            print("Error in update loop:", e)
            conn.rollback()
        finally:
            cur.close()

        time.sleep(UPDATE_INTERVAL_SECONDS)

except psycopg2.OperationalError as e:
    print("Database connection failed:", e)
except KeyboardInterrupt:
    print("Simulation interrupted.")
finally:
    if 'conn' in locals():
        conn.close()
        print("Connection closed.")
