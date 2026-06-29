const DEFAULT_SAFE_LIMIT = 3200;
export function splitTextForTelegram(text, maxLength = DEFAULT_SAFE_LIMIT) {
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!normalized)
        return ["No response received."];
    if (normalized.length <= maxLength)
        return [normalized];
    const chunks = [];
    const paragraphs = normalized.split(/\n{2,}/);
    let current = "";
    for (const paragraph of paragraphs) {
        const separator = current ? "\n\n" : "";
        const candidate = `${current}${separator}${paragraph}`;
        if (candidate.length <= maxLength) {
            current = candidate;
            continue;
        }
        if (current) {
            chunks.push(current);
            current = "";
        }
        chunks.push(...splitLongBlock(paragraph, maxLength));
    }
    if (current)
        chunks.push(current);
    return chunks;
}
function splitLongBlock(block, maxLength) {
    const lines = block.split("\n");
    const chunks = [];
    let current = "";
    for (const line of lines) {
        const separator = current ? "\n" : "";
        const candidate = `${current}${separator}${line}`;
        if (candidate.length <= maxLength) {
            current = candidate;
            continue;
        }
        if (current) {
            chunks.push(current);
            current = "";
        }
        chunks.push(...splitLongLine(line, maxLength));
    }
    if (current)
        chunks.push(current);
    return chunks;
}
function splitLongLine(line, maxLength) {
    const chunks = [];
    let remaining = line.trim();
    while (remaining.length > maxLength) {
        let splitIndex = remaining.lastIndexOf(" ", maxLength);
        if (splitIndex < Math.floor(maxLength * 0.6)) {
            splitIndex = maxLength;
        }
        chunks.push(remaining.slice(0, splitIndex).trim());
        remaining = remaining.slice(splitIndex).trim();
    }
    if (remaining)
        chunks.push(remaining);
    return chunks;
}
