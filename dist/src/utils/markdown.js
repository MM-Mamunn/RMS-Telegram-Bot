const markdownV2SpecialChars = /[_*[\]()~`>#+\-=|{}.!]/g;
export function toTelegramMarkdownV2(markdown) {
    const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!normalized) {
        return "No response received\\.";
    }
    const lines = normalized.split("\n");
    const output = [];
    let codeBuffer = null;
    for (const line of lines) {
        if (/^\s*```/.test(line)) {
            if (codeBuffer === null) {
                codeBuffer = [];
            }
            else {
                output.push(formatCodeBlock(codeBuffer.join("\n")));
                codeBuffer = null;
            }
            continue;
        }
        if (codeBuffer !== null) {
            codeBuffer.push(line);
            continue;
        }
        output.push(formatMarkdownLine(line));
    }
    if (codeBuffer !== null) {
        output.push(formatCodeBlock(codeBuffer.join("\n")));
    }
    return output.join("\n").trim() || "No response received\\.";
}
function formatMarkdownLine(line) {
    if (!line.trim())
        return "";
    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (headingMatch?.[1]) {
        return `*${escapeMarkdownV2(stripInlineMarkdown(headingMatch[1]))}*`;
    }
    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        return escapeMarkdownV2("---");
    }
    const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (unorderedMatch?.[2]) {
        return `${escapeMarkdownV2(`${unorderedMatch[1] ?? ""}- `)}${formatInlineMarkdown(unorderedMatch[2])}`;
    }
    const orderedMatch = line.match(/^(\s*\d+)\.\s+(.+)$/);
    if (orderedMatch?.[1] && orderedMatch?.[2]) {
        return `${escapeMarkdownV2(`${orderedMatch[1]}. `)}${formatInlineMarkdown(orderedMatch[2])}`;
    }
    const quoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (quoteMatch?.[1] !== undefined) {
        return `${escapeMarkdownV2("> ")}${formatInlineMarkdown(quoteMatch[1])}`;
    }
    return formatInlineMarkdown(line);
}
function formatInlineMarkdown(value) {
    const placeholders = [];
    const hold = (replacement) => {
        const token = `\u0000${placeholders.length}\u0000`;
        placeholders.push(replacement);
        return token;
    };
    let source = value;
    source = source.replace(/`([^`\n]+)`/g, (_match, code) => hold(`\`${escapeCode(code)}\``));
    source = source.replace(/\[([^\]\n]+)]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => hold(`[${escapeMarkdownV2(label)}](${escapeMarkdownUrl(url)})`));
    source = source.replace(/\*\*([^*\n]+)\*\*/g, (_match, content) => hold(`*${escapeMarkdownV2(content)}*`));
    source = source.replace(/__([^_\n]+)__/g, (_match, content) => hold(`*${escapeMarkdownV2(content)}*`));
    source = source.replace(/~~([^~\n]+)~~/g, (_match, content) => hold(`~${escapeMarkdownV2(content)}~`));
    source = source.replace(/(^|[\s([])\*([^*\n]+)\*/g, (_match, prefix, content) => `${prefix}${hold(`_${escapeMarkdownV2(content)}_`)}`);
    source = source.replace(/(^|[\s([])_([^_\n]+)_/g, (_match, prefix, content) => `${prefix}${hold(`_${escapeMarkdownV2(content)}_`)}`);
    let formatted = escapeMarkdownV2(source);
    placeholders.forEach((replacement, index) => {
        formatted = formatted.split(`\u0000${index}\u0000`).join(replacement);
    });
    return formatted;
}
function formatCodeBlock(content) {
    return `\`\`\`\n${escapeCode(content.trimEnd())}\n\`\`\``;
}
function escapeMarkdownV2(value) {
    return value.replace(/\\/g, "\\\\").replace(markdownV2SpecialChars, "\\$&");
}
function escapeMarkdownUrl(value) {
    return value.replace(/\\/g, "\\\\").replace(/\)/g, "\\)");
}
function escapeCode(value) {
    return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}
function stripInlineMarkdown(value) {
    return value
        .replace(/\[([^\]\n]+)]\((https?:\/\/[^\s)]+)\)/g, "$1")
        .replace(/[*_~`]/g, "")
        .trim();
}
