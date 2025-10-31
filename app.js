let API = "https://api.carrismetropolitana.pt/v2";

let infoboard = document.getElementById("infoboard")
let stopName = infoboard.querySelector("#title")
let linesDiv = infoboard.querySelector("#lines")
let departures = infoboard.querySelector("#departures")

let arrivalUpdate;
let departures2 = document.createElement("div")

let lines;

fetch(API + "/stops").then(r => r.json()).then(async stops => {
    lines = await fetch(API + "/lines").then(r => r.json()).catch(e => {throw e})
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
                clearInterval(arrivalUpdate)
                infoboard.classList.remove("hidden")
                stopName.innerHTML = stop.long_name
                linesDiv.innerHTML = stop.line_ids.map(z => "<span class=\line\ style=\"background-color:" + lines.find(a => a.short_name === z).color + "\">" + z + "</span>").reduce((acc, v) => acc = acc + v, "")
                departures.innerHTML = "A carregar viagens..."
                loadArrivals(stop.id)
                arrivalUpdate = setInterval(() => {
                    loadArrivals(stop.id)
                }, 30000)
                map.setView([latlng[0] - 0.00075, latlng[1]], 18)
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

function loadArrivals(id) {
    fetch(API + "/arrivals/by_stop/" + id, { mode: "cors"}).then(r => r.json()).then(arrivals => {
        console.log(arrivals)
        departures2.innerHTML = ""
        if(!arrivals) {
            departures.innerHTML = "Falha ao carregar dados"
            return
        }
        arrivals.filter(z => !z.observed_arrival_unix && (z.scheduled_arrival_unix > (Date.now()/1000) || z.estimated_arrival_unix > (Date.now()/1000))).forEach(arrival => {
            let departure = document.createElement("div")
            departure.className = "departure"
            departure.id = arrival.trip_id
            let ontime = (arrival.estimated_arrival_unix) <= (arrival.scheduled_arrival_unix + 60) && arrival.estimated_arrival_unix 
            departure.innerHTML = `
            <span class="line" style="background-color: ${lines.find(a => a.short_name === arrival.line_id).color}">${arrival.line_id}</span>
            <span class="dest">${arrival.headsign}</span>
            <span class="arrival ${ontime ? "ontime" : ""}">${(ontime || !arrival.estimated_arrival) ? sanitize((arrival.estimated_arrival || arrival.scheduled_arrival).substring(0, 5)) : `<span class="scheduled">${sanitize(arrival.scheduled_arrival.substring(0,5))}</span><span class="estimated">${sanitize(arrival.estimated_arrival.substring(0,5))}</span>`}</span>
            `
            departures2.appendChild(departure)
        })
        departures.innerHTML = departures2.outerHTML
    }).catch((e) => {
        console.log(e)
        departures.innerHTML = "Falha ao carregar dados"
        return
    })
}

function sanitize(time) {
    return time.replace("24:","00:").replace("25:","01:").replace("26:","02:").replace("27:","03:").replace("28:","04:").replace("29:","05:").replace("30:","06:").replace("31:","07:")
}