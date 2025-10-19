document.addEventListener('DOMContentLoaded', function () {
  const map = new ol.Map({
    target: 'map',
    view: new ol.View({
      center: ol.proj.fromLonLat([79.8612, 6.9271]), // Colombo
      zoom: 13,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
  });

  const popup = new ol.Overlay({
    element: document.getElementById('popup'),
    autoPan: true,
    autoPanAnimation: { duration: 250 },
  });
  map.addOverlay(popup);


  let vectorLayer;
  let selectedPointFeature = null;

  const assetStyle = function (feature) {
    const coordinates = ol.proj.toLonLat(feature.getGeometry().getCoordinates());
    const coordText = `(${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)})`;

    let iconSrc;
    const assetName = feature.get('name');
    const assetType = feature.get('asset_type');
    const assetNameLower = assetName.toLowerCase();

    if (assetType === 'person') {
      iconSrc = 'static/people.png';
    } else if (assetNameLower.startsWith('car')) {
      iconSrc = 'static/car.png';
    } else if (assetNameLower.startsWith('bus')) {
      iconSrc = 'static/bus.png';
    } else if (assetNameLower.startsWith('van')) {
      iconSrc = 'static/van.png';
    } else if (assetNameLower.startsWith('train')) {
      iconSrc = 'static/train.png';
    } else if (assetNameLower.startsWith('lorry') || assetNameLower.startsWith('truck')) {
      iconSrc = 'static/lorry.png';
    } else if (assetNameLower.includes('tuk')) {
      iconSrc = 'static/tuk-tuk.png';
    } else {
      iconSrc = 'static/default.png';
    }

    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        src: iconSrc,
        scale: 0.06,
      }),
      text: new ol.style.Text({
        text: `${feature.get('name')} (${assetType})\n${coordText}`,
        font: '12px Calibri,sans-serif',
        fill: new ol.style.Fill({ color: '#000' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
        offsetY: -45,
      }),
    });
  };

  function loadAssets() {
    fetch('/assets')
      .then(response => response.json())
      .then(data => {
        const features = new ol.format.GeoJSON().readFeatures(data, {
          featureProjection: 'EPSG:3857',
        });

        if (vectorLayer) {
          const source = vectorLayer.getSource();
          source.clear();
          source.addFeatures(features);
          vectorLayer.setStyle(assetStyle);
        } else {
          vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features }),
            style: assetStyle,
          });
          map.addLayer(vectorLayer);
        }
      })
      .catch(error => console.error('Error loading assets:', error));
  }

  loadAssets();
  setInterval(loadAssets, 3000);

  const resultDiv = document.getElementById('result');
  const pickBtn = document.getElementById('pick-location');
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'cancel-location';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.display = 'none';
  document.body.appendChild(cancelBtn);

  let pickingMode = false;

  pickBtn.addEventListener('click', function () {
    pickingMode = true;
    alert('Click on the map to pick a location.');
  });

  cancelBtn.addEventListener('click', function () {
    if (selectedPointFeature) {
      selectedPointFeature.getSource().clear();
      cancelBtn.style.display = 'none';
      resultDiv.innerHTML = ''; // Clear the result div
    }
    pickingMode = false; // Stop picking mode
  });

  map.on('click', function (evt) {
    if (!pickingMode) return;

    const coords = ol.proj.toLonLat(evt.coordinate);
    const [lon, lat] = coords;

    // Create a layer to show the selected point only once
    if (!selectedPointFeature) {
      selectedPointFeature = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5, 1], // Adjust anchor point as needed
            src: 'static/location.png', // Replace with your actual icon filename
            scale: 0.06 // Adjust scale to size the icon correctly
          }),
        }),
        
        }),
      
      map.addLayer(selectedPointFeature);
    } else {
      selectedPointFeature.getSource().clear(); // Clear previous point
    }

    const pointFeature = new ol.Feature(new ol.geom.Point(evt.coordinate));
    selectedPointFeature.getSource().addFeature(pointFeature);

    fetch('/nearest_asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: lat, lon: lon }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          resultDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
        } else {
          resultDiv.innerHTML = `
            <div id="result-container">
              <div id="vehicle-info">
                <h4>Nearest Vehicle</h4>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Type:</strong> ${data.asset_type}</p>
                <p><strong>Distance:</strong> ${data.distance_meters} meters</p>
              </div>
              <div id="button-container">
                <button id="book-now">Book Now</button>
                <button id="cancel-location">Cancel</button>
              </div>
            </div>
          `;
          // 👇 Add this line here to scroll the result into view
          resultDiv.scrollIntoView({ behavior: 'smooth' });
           // Show the cancel button
          document.getElementById('cancel-location').style.display = 'inline-block';
          
          document.getElementById('book-now').addEventListener('click', () => {
            alert(`Booking requested for: ${data.name}`);
          });
  
          document.getElementById('cancel-location').addEventListener('click', () => {
            if (selectedPointFeature) {
              selectedPointFeature.getSource().clear();
            }
            resultDiv.innerHTML = '';
            pickingMode = false;
          });
        }
      })
      .catch(error => {
        resultDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
      });
  
    pickingMode = false; // Stop picking mode after click
  });
});
