let API = "https://api.carrismetropolitana.pt/v2";

let infoboard = document.getElementById("infoboard")
let stopName = infoboard.querySelector("#title")
let linesDiv = infoboard.querySelector("#lines")
let departures = infoboard.querySelector("#departures")

fetch(API + "/stops").then(r => r.json()).then(async stops => {
    let lines = await fetch(API + "/lines").then(r => r.json()).catch(e => {throw e})
    console.log(lines)
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
                infoboard.classList.remove("hidden")
                stopName.innerHTML = stop.long_name
                linesDiv.innerHTML = stop.line_ids.map(z => "<span class=\line\ style=\"background-color:" + lines.find(a => a.short_name === z).color + "\">" + z + "</span>").reduce((acc, v) => acc = acc + v, "")
                departures.innerHTML = "A carregar viagens..."
                fetch(API + "/arrivals/by_stop/" + stop.id).then(r => r.json()).then(arrivals => {
                    departures.innerHTML = ""
                    arrivals.filter(z => !z.observed_arrival_unix || z.scheduled_arrival_unix > Date.now()).forEach(arrival => {
                        let departure = document.createElement("div")
                        departure.className = "departure"
                        departure.id = arrival.trip_id
                        departure.innerHTML = `
                        <span class="line" style="background-color: ${lines.find(a => a.short_name === arrival.line_id).color}">${arrival.line_id}</span>
                        <span class="dest">${arrival.headsign}</span>
                        <span class="arrival ${arrival.estimated_arrival ? "ontime" : ""}">${(arrival.estimated_arrival || arrival.scheduled_arrival).substring(0, 5)}</span>
                        `
                        departures.appendChild(departure)
                    })
                })
                map.moveTo(latlng, 16)
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