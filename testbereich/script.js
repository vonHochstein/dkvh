
async function runOCR() {
    const imageInput = document.getElementById('imageInput');
    const ocrResult = document.getElementById('ocrResult');

    if (!imageInput.files.length) {
        alert("Bitte ein Bild auswählen.");
        return;
    }

    ocrResult.value = "Erkenne Text... Bitte warten.";

    const worker = await Tesseract.createWorker('deu');
    const { data } = await worker.recognize(imageInput.files[0]);
    await worker.terminate();

    const text = data.text;
    ocrResult.value = text;

    // Optional: Vorerkennung für Diagnose / Arzt (vereinfachter Versuch)
    const diagnoseMatch = text.match(/ICD[- ]?10.*?([A-Z]\d{2}\.\d)/i);
    if (diagnoseMatch) document.getElementById('diagnose').value = diagnoseMatch[1];

    const arztMatch = text.match(/Dr\.\s+[\wäöüÄÖÜß\s]+/i);
    if (arztMatch) document.getElementById('arzt').value = arztMatch[0];
}

function exportCSV() {
    const rawText = document.getElementById('ocrResult').value.replace(/\n/g, ' ');
    const diagnose = document.getElementById('diagnose').value;
    const arzt = document.getElementById('arzt').value;

    // Einfacher CSV-Zeilenaufbau – später durch gezielte Extraktion ersetzen
    const csvLine = `"${rawText}";"${diagnose}";"${arzt}"\n`;

    const blob = new Blob([csvLine], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById('csvDownloadLink');
    link.href = URL.createObjectURL(blob);
    link.style.display = 'block';
    link.click();
}
