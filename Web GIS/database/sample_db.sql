INSERT INTO assets (name, asset_type, geom) VALUES
  ('Truck', 'vehicle', ST_SetSRID(ST_MakePoint(79.88, 6.90), 4326)),
  ('person 1', 'person', ST_SetSRID(ST_MakePoint(79.91517, 6.97530), 4326)),
  ('person 2', 'person', ST_SetSRID(ST_MakePoint(79.900754, 6.795150), 4326)),
  ('Van 1', 'Vehicle',ST_SetSRID(ST_MakePoint(80.20064, 6.95042), 4326)),
  ('Car 1', 'vehicle', ST_SetSRID(ST_MakePoint(80.01132, 7.08149), 4326)),
  ('Car 2', 'vehicle', ST_SetSRID(ST_MakePoint(79.96992, 6.59345), 4326)),
  ('Van 2', 'vehicle', ST_SetSRID(ST_MakePoint(79.98924, 6.71401), 4326)),
  ('Bus 1','vehicle',ST_SetSRID(ST_MakePoint(79.98396, 6.93482), 4326)),
  ('Bus 2','vehicle',ST_SetSRID(ST_MakePoint(79.90920, 7.23071), 4326)),
  ('Train 1','vehicle',ST_SetSRID(ST_MakePoint(80.01901, 6.84699), 4326)),
  ('Train 2','vehicle',ST_SetSRID(ST_MakePoint(79.86505, 6.92946), 4326)), 
  ('Tuk 1','vehicle',ST_SetSRID(ST_MakePoint(79.95310, 7.00253), 4326)),
  ('Tuk 2','vehicle',ST_SetSRID(ST_MakePoint(79.87319,6.85606), 4326)),
  ('Tuk 3','vehicle',ST_SetSRID(ST_MakePoint( 80.05616,7.14963), 4326)),
  ('Lorry 1', 'vehicle', ST_SetSRID(ST_MakePoint(79.98031, 6.84086), 4326)),
  ('Lorry 2', 'vehicle', ST_SetSRID(ST_MakePoint(80.22430, 6.91504), 4326));
  
  
                               

  
SELECT id, name, ST_AsText(geom) AS geom_wkt
FROM assets
WHERE name = 'Bus 2';

SELECT id, name, ST_AsText(geom) AS geom_wkt
FROM assets
WHERE name = 'Tuk 1';
