async function runOCR() {
    const imageInput = document.getElementById('imageInput');
    const progressBar = document.getElementById('ocrProgress');

    if (!imageInput.files.length) {
        alert("Bitte ein Bild auswählen.");
        return;
    }

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

        const { data: { text } } = await worker.recognize(imageInput.files[0]);
        progressBar.value = 1;

        // OCR-Ausgabe in Felder schreiben
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
}

function exportCSV() {
    const fields = [
        'krankenkasse', 'name', 'adresse', 'geburtsdatum', 'kostentraeger',
        'versichertennr', 'status', 'bsnr', 'arztnr', 'datumfest',
        'diagnose', 'arzt'
    ];

    const values = fields.map(id => {
        const val = document.getElementById(id).value || '';
        return `"${val.replace(/"/g, '""')}"`;
    });

    const csvLine = values.join(";") + "\n";
    const blob = new Blob([csvLine], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById('csvDownloadLink');
    link.href = URL.createObjectURL(blob);
    link.style.display = 'block';
    link.click();
}
