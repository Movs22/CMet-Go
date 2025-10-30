let API = "https://api.carrismetropolitana.pt/v2";


fetch(API + "/stops").then(r => r.json()).then(stops => {
    let stopMarkers = []; // keep track of current markers
    const MIN_ZOOM_TO_SHOW = 15;

    function updateStops() {
        // Remove existing markers
        stopMarkers.forEach(m => map.removeLayer(m));
        stopMarkers = [];

        const zoom = map.getZoom();
        if (zoom < MIN_ZOOM_TO_SHOW) return; // too zoomed out, don’t show

        const bounds = map.getBounds();
        stops.forEach(stop => {
            const latlng = [stop.lat, stop.lon];
            if (!bounds.contains(latlng)) return; // only show stops in viewport

            const marker = L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#ffdd01',
                color: '#ffdd01',
                weight: 1,
                fillOpacity: 0.9
            });

            marker.on('click', () => {
                marker.bindPopup(`<b>${stop.long_name}</b>`).openPopup();
            });

            marker.addTo(map);
            stopMarkers.push(marker);
        });
    }

    // Call on map move or zoom
    map.on('moveend', updateStops);
    map.on('zoomend', updateStops);

    // Initial call
    updateStops();
}).catch(() => {
    alert("Falha ao atualizar dados")
})