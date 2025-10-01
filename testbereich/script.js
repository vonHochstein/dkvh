
const JS_VERSION = 'v1.6';

let csvRows = [];

// Smart OCR Funktion
async function runSmartOCR() {
    const imageInput = document.getElementById('imageInput');
    const progressBar = document.getElementById('ocrProgress');

    if (!imageInput.files.length) {
        alert("Bitte ein Bild auswählen.");
        return;
    }

    preprocessImage(imageInput.files[0], async function (imageDataURL) {
        const image = new Image();
        image.src = imageDataURL;

        image.onload = async function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const { createWorker } = Tesseract;
            const worker = await createWorker({
                logger: m => {
                    if (m.status === 'recognizing text') {
                        progressBar.style.display = 'block';
                        progressBar.value = m.progress;
                    }
                }
            });

            await worker.loadLanguage('deu');
            await worker.initialize('deu');

            const { data: { text } } = await worker.recognize(canvas);
            await worker.terminate();
            progressBar.style.display = 'none';

            const clean = t => t.replace(/\s+/g, ' ').trim();
            const findPattern = (pattern, lines) => {
                for (const line of lines) {
                    const match = line.match(pattern);
                    if (match) return clean(match[1] || match[0]);
                }
                return '';
            };

            const lines = text.split('\n').map(line => line.trim());

            const fields = {
                krankenkasse: findPattern(/^(.*Heilfürsorge.*|.*Krankenkasse.*)/i, lines),
                name: findPattern(/^(?:Name)?\s*:?\s*([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß-]+)/, lines),
                adresse: findPattern(/\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+\b/, lines),
                geburtsdatum: findPattern(/geb\.?(?:urtsdatum)?\s*am\s*(\d{2}[\.\-/]\d{2}[\.\-/]\d{2,4})/i, lines) || findPattern(/([0-3]\d[\.\-/][01]\d[\.\-/](?:\d{2}|\d{4}))/i, lines),
                kostentraeger: findPattern(/Kostenträgerkennung.*?(\d{4,})/, lines),
                versichertennr: findPattern(/Versichertennummer.*?(\d{6,})/, lines),
                status: findPattern(/Status.*?(\d\s?\d{2}\s?\d{2}\s?\d{2})/, lines),
                bsnr: findPattern(/Betriebsstätten.*?(\d{8})/, lines),
                arztnr: findPattern(/Arztnummer.*?(\d{10})/, lines),
                datumfest: findPattern(/Feststellung.*?(\d{2}[\.\-/]\d{2}[\.\-/]\d{2,4})/, lines),
                diagnose: findPattern(/Diagnose\s*:?(.*)/i, lines),
                arzt: findPattern(/Dr\.\s?[A-ZÄÖÜ][a-zäöüß]+\s?[A-ZÄÖÜa-zäöüß]+/, lines)
            };

            for (const [key, value] of Object.entries(fields)) {
                const el = document.getElementById(key);
                if (el) el.value = value;
            }

            console.log("OCR-Ergebnis (gesamt):\n", text);
        };
    });
}

// CSV exportieren und Zeile anfügen
function exportCSV() {
    const fields = [
        'krankenkasse', 'name', 'adresse', 'geburtsdatum', 'kostentraeger',
        'versichertennr', 'status', 'bsnr', 'arztnr', 'datumfest', 'diagnose', 'arzt'
    ];

    const row = fields.map(id => {
        const el = document.getElementById(id);
        return el ? `"${(el.value || '').replace(/"/g, '""')}"` : '""';
    });

    csvRows.push(row.join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);

    const downloadLink = document.getElementById('csvDownloadLink');
    downloadLink.setAttribute('href', encodedUri);
    downloadLink.style.display = 'inline-block';
}

// Version anzeigen
window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('versionInfo');
    if (el) {
        el.innerHTML = el.innerHTML.replace('JS v…', `JS ${JS_VERSION}`);
    }
});
