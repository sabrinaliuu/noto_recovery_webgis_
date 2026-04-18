// --- Constants ---
const monthLabels = ["202408", "202409", "202410", "202411", "202412", "202501", "202502", "202503", "202504", "202505", "202506", "202507"];
const recoveryElements = ["housing", "social ties", "townscape", "physical and mental health", "preparedness", "relation to government", "economic and financial situation"];

const sentimentColors = {
    "positive": "#10b981",
    "neutral": "#94a3b8",
    "negative": "#f43f5e",
    "total": "#6366f1"
};

let currentIdx = 0, currentElem = "housing", map, miniChart, comparisonChart;

// --- toggle for Description of Study ---
function toggleOverview() {
    const content = document.getElementById('overviewContent'), icon = document.getElementById('overviewIcon');
    content.classList.toggle('show');
    icon.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// --- toggle for How to Use ---
function toggleDescription() {
    const content = document.getElementById('descriptionContent'), icon = document.getElementById('toggleIcon');
    content.classList.toggle('show');
    icon.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// --- Pie Chart ---
function createPieIcon(data) {
    const size = Math.sqrt(data.count) * 20;
    const html = `
        <div class="pie-icon" style="width: ${size}px; height: ${size}px;">
            <div class="pie-slice" style="width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(
                ${sentimentColors["positive"]} 0% ${Math.round(data.pPos)}%,
                ${sentimentColors["neutral"]} ${Math.round(data.pPos)}% ${Math.round(data.pPos) + Math.round(data.pNeu)}%,
                ${sentimentColors["negative"]} ${Math.round(data.pPos) + Math.round(data.pNeu)}% 100%
            );"></div>
        </div>
    `;
    return L.divIcon({ html: html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

// --- init for map ---
function init() {
    const subSelect = document.getElementById('subCategorySelect');
    recoveryElements.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.innerText = e;
        subSelect.appendChild(opt);
    });

    initMap();
    setupEventListeners();
}

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([37.15, 137.0], 9);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    updateMapLayers();
    addLegend();


}


fetch("/data/noto_poly.geojson")
    .then(res => res.json())
    .then(data => {
        L.geoJSON(data).addTo(map);
    });


let geoData = null;
let geoLayer = null;

(async function () {
    try {
        const res = await fetch("/data/noto.geojson");
        if (!res.ok) throw new Error("GeoJSON fetch failed");

        geoData = await res.json();

        updateMapLayers();
        initComparisonChart();
        updateCharts();


    } catch (e) {
        console.error("Error loading GeoJSON:", e);
    }
})();

// --- update layer (Pie Chart) ---
function updateMapLayers() {
    if (!geoData) return;
    if (geoLayer) map.removeLayer(geoLayer);

    geoLayer = L.geoJSON(geoData, {
        pointToLayer: function (feature, latlng) {
            const cityData = feature.properties.data;
            const currentMonth = monthLabels[currentIdx];
            const elemData = cityData[currentElem][currentIdx];
            const pieData = elemData || { count: 0, pPos: 0, pNeu: 0, pNeg: 0 };
            return L.marker(latlng, { icon: createPieIcon(pieData) });
        },
        onEachFeature: function (feature, layer) {
            const cityData = feature.properties.data;
            const currentMonth = monthLabels[currentIdx];
            const elemData = cityData[currentElem][currentIdx];
            const pieData = elemData || { count: 0, pPos: 0, pNeu: 0, pNeg: 0 };

            layer.bindTooltip(`
                <div class="p-1">
                    <b class="text-gray-700 font-bold">${feature.properties.SIKUCHOSON}</b><br>
                    Recovery Element: <span class="text-slate-600">${currentElem}</span><br>
                    Total Paragraph Counts: <span class="font-bold">${pieData.count}</span><br>
                    <hr class="my-1">
                    <span style="color:${sentimentColors["positive"]}">●</span> Positive: ${Math.round(pieData.pPos)}%<br>
                    <span style="color:${sentimentColors["neutral"]}">●</span> Neutral: ${Math.round(pieData.pNeu)}%<br>
                    <span style="color:${sentimentColors["negative"]}">●</span> Negative: ${Math.round(pieData.pNeg)}%
                </div>
            `, { sticky: true });

            layer.on("click", () => showDetail(feature.properties));
        }
    }).addTo(map);
}

// --- Bar Chart ---
function initComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const labels = geoData.features.map(f => f.properties.SIKUCHOSON);

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Positive %', backgroundColor: sentimentColors["positive"], data: [] },
                { label: 'Neutral %', backgroundColor: sentimentColors["neutral"], data: [] },
                { label: 'Negative %', backgroundColor: sentimentColors["negative"], data: [] }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { size: 11 } } }
            },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, max: 100 } }
        }
    });

    updateCharts();
}

// --- update Bar Chart---
function updateCharts() {
    if (!geoData) return;

    const currentMonth = monthLabels[currentIdx];

    comparisonChart.data.datasets[0].data = geoData.features.map(f => {
        const elemData = f.properties.data[currentElem][currentIdx];
        return elemData ? elemData.pPos : 0;
    });

    comparisonChart.data.datasets[1].data = geoData.features.map(f => {
        const elemData = f.properties.data[currentElem][currentIdx];
        return elemData ? elemData.pNeu : 0;
    });

    comparisonChart.data.datasets[2].data = geoData.features.map(f => {
        const elemData = f.properties.data[currentElem][currentIdx];
        return elemData ? elemData.pNeg : 0;
    });

    comparisonChart.update('none');
    document.getElementById('barChartSubTitle').innerText = `Recovery Element：${currentElem}`;
}

// --- show Line Chart Details ---
function showDetail(region) {

    const panel = document.getElementById('detailPanel');
    panel.classList.remove('hidden');

    document.getElementById('regionName').innerText = region.SIKUCHOSON;

    const currentMonth = monthLabels[currentIdx];
    const currentData = region.data[currentElem][currentIdx] || {
        count: 0, pPos: 0, pNeu: 0, pNeg: 0
    };


    if (miniChart) miniChart.destroy();

    const ctx = document.getElementById('miniChart').getContext('2d');

    const months = monthLabels;

    miniChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Positive %',
                    data: region.data[currentElem].map(d => Math.round(d.pPos) || 0),
                    borderColor: sentimentColors["positive"],
                    tension: 0.3,
                    pointRadius: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'neutral %',
                    data: region.data[currentElem].map(d => Math.round(d.pNeu) || 0),
                    borderColor: sentimentColors["neutral"],
                    tension: 0.3,
                    pointRadius: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Negative %',
                    data: region.data[currentElem].map(d => Math.round(d.pNeg) || 0),
                    borderColor: sentimentColors["negative"],
                    tension: 0.3,
                    pointRadius: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Total',
                    data: region.data[currentElem].map(d => d.count || 0),
                    borderColor: sentimentColors["total"],
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 3,
                    pointStyle: 'rectRot',
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 8, font: { size: 10 } }
                },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Propotion of Sentiments (%)',
                        font: { size: 10 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    title: {
                        display: true,
                        text: 'Total',
                        font: { size: 10 }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}
function closeDetail() {
    const panel = document.getElementById('detailPanel');
    panel.classList.add('hidden');
}

// add Legend for Map
function addLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <h4 class="font-bold mb-2">Legend</h4>
            <div class="space-y-1">
                <div><i style="background:${sentimentColors["positive"]}"></i> Positive</div>
                <div><i style="background:${sentimentColors["neutral"]}"></i> Neutral</div>
                <div><i style="background:${sentimentColors["negative"]}"></i> Negative</div>
            </div>
            <div class="border-t pt-2 mt-2 text-[10px] text-slate-400">
                <p>● Size = Paragraph Counts</p>
                <p>● Click the pie chart to see the details</p>
                <p>© 2026 Sabrina Liu</p>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
}

// --- handle Control's event ---
function setupEventListeners() {
    // handle the change of Recovery Elements
    const subSelect = document.getElementById('subCategorySelect');
    if (subSelect) {
        subSelect.addEventListener('change', e => {
            currentElem = e.target.value;

            updateMapLayers();
            updateCharts();

            const regionNameElem = document.getElementById('regionName');
            const activeName = regionNameElem ? regionNameElem.innerText : null;

            if (activeName && activeName !== "" && geoData) {
                const region = geoData.features.find(
                    f => f.properties.SIKUCHOSON === activeName
                );
                if (region) showDetail(region.properties);
            }
        });
    }

    // handle the change of time bar
    const monthSlider = document.getElementById('monthSlider');
    if (monthSlider) {
        monthSlider.addEventListener('input', e => {
            currentIdx = parseInt(e.target.value);
            const label = monthLabels[currentIdx];

            const monthDisplay = document.getElementById('monthDisplay');
            const compareMonthDisplay = document.getElementById('compareMonthDisplay');

            if (monthDisplay) monthDisplay.innerText = label;
            if (compareMonthDisplay) compareMonthDisplay.innerText = label.replace(/\s/g, '');

            updateMapLayers();
            updateCharts();


        });
    }
}

function toggleModal(id) {
    const panel = document.getElementById(id);
    const allModals = document.querySelectorAll('.modal-panel');
    allModals.forEach(m => { if (m !== panel) m.style.display = 'none'; });
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function closeDetail() {
    document.getElementById('detailPanel').classList.add('hidden');
    document.getElementById('regionName').textContent = "";
}

// --- drag panel ---
const modals = document.querySelectorAll('.modal-panel, #detailPanel');
modals.forEach(modal => {

    const header = modal.querySelector('.panel-header');
    if (!header) return;

    let isDragging = false, startX, startY, origX, origY;

    header.addEventListener('mousedown', (e) => {

        if (e.target.classList.contains('close-btn')) return;

        isDragging = true;

        startX = e.clientX;
        startY = e.clientY;

        const rect = modal.getBoundingClientRect();

        origX = rect.left;
        origY = rect.top;

        modal.style.transition = 'none';

    });

    document.addEventListener('mousemove', (e) => {

        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        modal.style.left = origX + dx + 'px';
        modal.style.top = origY + dy + 'px';

    });

    document.addEventListener('mouseup', () => {

        if (isDragging) {

            isDragging = false;
            modal.style.transition = 'all 0.3s ease';

        }

    });

});

// toggle left panel
function toggleLeftPanel() {

    const panel = document.getElementById("leftPanel");
    panel.classList.toggle("collapsed");

}

window.onload = init;