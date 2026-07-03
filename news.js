(function () {
  const list = document.getElementById("news-list");

  if (!list) {
    return;
  }

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const normalizeLinks = (item) => {
    if (Array.isArray(item.links)) {
      return item.links;
    }

    if (item.url) {
      return [
        {
          label: item.linkLabel || "詳しく見る",
          url: item.url,
        },
      ];
    }

    return [];
  };

  const render = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      list.innerHTML = '<p class="news-loading">現在掲載中のお知らせはありません。</p>';
      return;
    }

    list.innerHTML = items
      .slice(0, 4)
      .map((item) => {
        const date = escapeHtml(item.date || "");
        const category = escapeHtml(item.category || "お知らせ");
        const title = escapeHtml(item.title || "");
        const body = item.body ? escapeHtml(item.body) : "";
        const links = normalizeLinks(item)
          .filter((link) => link && link.url)
          .map((link) => {
            const label = escapeHtml(link.label || "詳しく見る");
            const url = escapeHtml(link.url);
            return `<a class="news-link" href="${url}" target="_blank" rel="noopener">${label}</a>`;
          })
          .join("");

        return `
          <details class="news-item">
            <summary>
              <span class="news-meta">
                <span class="news-tag">${category}</span>
                <time>${date}</time>
              </span>
              <span class="news-title">${title}</span>
            </summary>
            <div class="news-content">
              <h3>${title}</h3>
              ${body ? `<p>${body}</p>` : ""}
              ${links ? `<div class="news-links">${links}</div>` : ""}
            </div>
          </details>
        `;
      })
      .join("");
  };

  fetch("news.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("news.json could not be loaded");
      }
      return response.json();
    })
    .then(render)
    .catch(() => {
      list.innerHTML =
        '<p class="news-loading">お知らせは公開環境で表示されます。更新は news.json を編集してください。</p>';
    });
})();
