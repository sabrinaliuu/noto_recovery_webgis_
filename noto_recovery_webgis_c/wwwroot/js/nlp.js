// --- Recognition by NLP Models ---
async function analyzeText() {
    const text = document.getElementById('aiInput').value.trim();
    if (!text) return;

    const loader = document.getElementById('aiLoading');
    loader.classList.remove('hidden');

    try {

        const response = await fetch("/api/Recognition/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();
        loader.classList.add('hidden');
        document.getElementById('aiContent').classList.remove('hidden');

        document.getElementById('resElements').innerHTML =
            data.elements.map(e =>
                `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold mr-1 mb-1 shadow-sm border border-indigo-200">${e}</span>`
            ).join('');

        document.getElementById('resPlaces').innerText =
            data.places.join('、') || 'No Noto Peninsula city name';


        document.getElementById('resSentiment').innerText =
            data.sentiment;


    } catch (e) {
        loader.innerHTML = "Error";
    }
}