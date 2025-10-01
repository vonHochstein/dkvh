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

            const clean = txt => (txt || '').replace(/["']/g, '').trim();

            document.getElementById('krankenkasse').value =
                clean((text.match(/Krankenkasse[:\s]*\n?(.*)/i) || [,''])[1]);

            document.getElementById('name').value =
                clean((text.match(/Name[:\s]*\n?(.*)/i) || [,''])[1]);

            const gebDatumMatch = text.match(/geb\.?\s*am\s*(\d{2}\.\d{2}\.\d{2,4})/i)
                || text.match(/Geburtsdatum[:\s]*\n?(\d{2}\.\d{2}\.\d{2,4})/)
                || text.match(/\b(\d{2}\.\d{2}\.\d{2,4})\b/);
            document.getElementById('geburtsdatum').value = clean((gebDatumMatch || [])[1]);

            const adrMatch = text.match(/\d{5}\s+[\wäöüßÄÖÜ\- ]+/);
            document.getElementById('adresse').value = clean((adrMatch || [])[0]);

            const statusMatch = text.match(/Status\s*:?\s*([10][\s0]{6,})/)
                || text.match(/\b[10] ?0{6,7}\b/);
            document.getElementById('status').value = clean((statusMatch || [])[1]?.replace(/\s+/g, ''));

            document.getElementById('kostentraeger').value =
                clean((text.match(/Kostentr[aä]gerkennung[:\s]*\n?(\d{5,})/) || [,''])[1]);

            document.getElementById('versichertennr').value =
                clean((text.match(/Versichertennummer[:\s]*\n?([A-Z0-9]+)/i) || [,''])[1]);

            document.getElementById('bsnr').value =
                clean((text.match(/Betriebsst[aä]ttennummer.*?(\d{9})/) || [,''])[1]);

            document.getElementById('arztnr').value =
                clean((text.match(/Arztnummer.*?(\d{9})/) || [,''])[1]);

            const datums = text.match(/\b\d{2}\.\d{2}\.\d{2,4}\b/g);
            document.getElementById('datumfest').value = clean((datums && datums.length > 0) ? datums[0] : '');

            const diagMatch = text.match(/ICD[- ]?10\s*[:\-]?\s*([A-Z]\d{2}(\.\d)?)/i);
            document.getElementById('diagnose').value = clean((diagMatch || [])[1]);

            const arztMatch = text.match(/(Dr\.?\s+[\wäöüÄÖÜß\s]{3,})/);
            document.getElementById('arzt').value = clean((arztMatch || [])[1]);

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
