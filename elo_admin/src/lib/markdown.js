export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInline(text) {
  const parts = [];
  const token = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match = token.exec(text);

  while (match) {
    parts.push(escapeHtml(text.slice(last, match.index)));

    if (match[2] != null) {
      parts.push(`<img src="${escapeHtml(match[2])}" alt="${escapeHtml(match[1])}" />`);
    } else if (match[4] != null) {
      parts.push(`<a href="${escapeHtml(match[4])}" target="_blank" rel="noreferrer">${escapeHtml(match[3])}</a>`);
    } else if (match[5] != null) {
      parts.push(`<code>${escapeHtml(match[5])}</code>`);
    } else if (match[6] != null) {
      parts.push(`<strong>${escapeHtml(match[6])}</strong>`);
    } else {
      parts.push(`<em>${escapeHtml(match[7])}</em>`);
    }

    last = match.index + match[0].length;
    match = token.exec(text);
  }

  parts.push(escapeHtml(text.slice(last)));

  return parts.join('');
}

export function markdownToHtml(source) {
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith('```')) {
      const block = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith('```')) {
        block.push(lines[index]);
        index += 1;
      }

      html.push(`<pre><code>${escapeHtml(block.join('\n'))}</code></pre>`);
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      index += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      index += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = [];

      while (index < lines.length && lines[index].startsWith('> ')) {
        quote.push(lines[index].slice(2));
        index += 1;
      }

      html.push(`<blockquote><p>${formatInline(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^[-*] /.test(line)) {
      html.push('<ul>');

      while (index < lines.length && /^[-*] /.test(lines[index])) {
        html.push(`<li>${formatInline(lines[index].slice(2))}</li>`);
        index += 1;
      }

      html.push('</ul>');
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;

    while (index < lines.length && lines[index].trim() && !/^(#{1,3} |> |[-*] |```)/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }

    html.push(`<p>${formatInline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}
