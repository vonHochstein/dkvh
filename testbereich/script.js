let csvBuffer = [];

function preprocessImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
                const contrast = 2.0;
                const offset = 128 * (1 - contrast);
                const newVal = contrast * avg + offset;
                data[i] = data[i + 1] = data[i + 2] = newVal;
            }

            ctx.putImageData(imageData, 0, 0);
            const previewURL = canvas.toDataURL('image/png');

            // Vorschau anzeigen
            const preview = document.getElementById('imgPreview');
            preview.src = previewURL;
            preview.style.display = 'block';

            callback(previewURL);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function runOCR() {
    const imageInput = document.getElementById('imageInput');
    const progressBar = document.getElementById('ocrProgress');

    if (!imageInput.files.length) {
        alert("Bitte ein Bild auswählen.");
        return;
    }

    preprocessImage(imageInput.files[0], async function (processedImageDataURL) {
        const { createWorker } = Tesseract;
        const worker = await createWorker({
            logger: m => {
                if (m.status === 'recognizing text') {
                    progressBar.style.display = 'block';
                    progressBar.value = m.progress;
                }
            }
        });

        try {
            await worker.loadLanguage('deu');
            await worker.initialize('deu');

            const { data: { text } } = await worker.recognize(processedImageDataURL);
            progressBar.value = 1;

            document.getElementById('krankenkasse').value = (text.match(/Krankenkasse.*?\n(.*)/i) || [,''])[1]?.trim() || '';
            document.getElementById('name').value = (text.match(/Name.*?\n(.*)/i) || [,''])[1]?.trim() || '';
            document.getElementById('adresse').value = (text.match(/\d{5}\s+\w+/) || [])[0] || '';
            document.getElementById('geburtsdatum').value = (text.match(/\b\d{2}\.\d{2}\.\d{2,4}\b/) || [])[0] || '';
            document.getElementById('kostentraeger').value = (text.match(/Kostentr[aä]gerkennung\s*\n?([\d ]{6,})/) || [,''])[1]?.replace(/\s+/g, '') || '';
            document.getElementById('versichertennr').value = (text.match(/Versichertennummer\s*\n?([A-Z0-9]+)/i) || [,''])[1] || '';
            document.getElementById('status').value = (text.match(/Status\s*\n?(\d{1} ?0{6,7})/) || [,''])[1]?.replace(/\s+/g, '') || '';
            document.getElementById('bsnr').value = (text.match(/Betriebsst[aä]ttennummer.*?(\d{9})/) || [,''])[1] || '';
            document.getElementById('arztnr').value = (text.match(/Arztnummer.*?(\d{9})/) || [,''])[1] || '';
            document.getElementById('datumfest').value = (text.match(/\b(\d{2}\.\d{2}\.\d{2,4})\b/) || [,''])[1] || '';
            document.getElementById('diagnose').value = (text.match(/ICD[- ]?10.*?([A-Z]\d{2}\.\d)/i) || [,''])[1] || '';
            document.getElementById('arzt').value = (text.match(/Dr\.\s+[\wäöüÄÖÜß\s]+/) || [])[0] || '';

        } catch (err) {
            alert("Fehler bei der Texterkennung: " + err.message);
            console.error(err);
        } finally {
            await worker.terminate();
            progressBar.style.display = 'none';
        }
    });
}

function addToBuffer() {
    const fields = [
        'krankenkasse', 'name', 'adresse', 'geburtsdatum', 'kostentraeger',
        'versichertennr', 'status', 'bsnr', 'arztnr', 'datumfest',
        'diagnose', 'arzt'
    ];

    const values = fields.map(id => {
        const val = document.getElementById(id).value || '';
        return `"${val.replace(/"/g, '""')}"`;
    });

    csvBuffer.push(values.join(";"));
    alert("Datensatz zur CSV-Liste hinzugefügt.");
}

function exportCSV() {
    if (csvBuffer.length === 0) {
        alert("Noch keine Datensätze hinzugefügt.");
        return;
    }

    const csvText = csvBuffer.join("\n") + "\n";
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById('csvDownloadLink');
    link.href = URL.createObjectURL(blob);
    link.style.display = 'block';
    link.click();
}
