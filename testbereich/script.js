async function runOCR() {
    const imageInput = document.getElementById('imageInput');
    const ocrResult = document.getElementById('ocrResult');
    const diagnoseInput = document.getElementById('diagnose');
    const arztInput = document.getElementById('arzt');

    if (!imageInput.files.length) {
        alert("Bitte ein Bild auswählen.");
        return;
    }

    ocrResult.value = "Erkenne Text... Bitte warten.";

    const { createWorker } = Tesseract;
    const worker = await createWorker({
        logger: m => {
            console.log(m);
            ocrResult.value = `Fortschritt: ${Math.round(m.progress * 100)}%`;
        }
    });

    try {
        await worker.loadLanguage('deu');
        await worker.initialize('deu');

        const { data: { text } } = await worker.recognize(imageInput.files[0]);
        ocrResult.value = text;

        // Einfacher Versuch, Diagnose und Arzt automatisch zu erkennen
        const diagnoseMatch = text.match(/ICD[- ]?10.*?([A-Z]\d{2}\.\d)/i);
        if (diagnoseMatch) diagnoseInput.value = diagnoseMatch[1];

        const arztMatch = text.match(/Dr\.\s+[\wäöüÄÖÜß\s]+/i);
        if (arztMatch) arztInput.value = arztMatch[0];

    } catch (err) {
        ocrResult.value = "Fehler bei der Texterkennung: " + err.message;
        console.error(err);
    } finally {
        await worker.terminate();
    }
}

function exportCSV() {
    const rawText = document.getElementById('ocrResult').value.replace(/\n/g, ' ');
    const diagnose = document.getElementById('diagnose').value;
    const arzt = document.getElementById('arzt').value;

    const csvLine = `"${rawText}";"${diagnose}";"${arzt}"\n`;

    const blob = new Blob([csvLine], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById('csvDownloadLink');
    link.href = URL.createObjectURL(blob);
    link.style.display = 'block';
    link.click();
}
