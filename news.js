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
        const url = item.url ? escapeHtml(item.url) : "";
        const titleHtml = url
          ? `<a href="${url}" target="_blank" rel="noopener">${title}</a>`
          : `<span>${title}</span>`;

        return `
          <article class="news-item">
            <div class="news-meta">
              <span class="news-tag">${category}</span>
              <time>${date}</time>
            </div>
            <h3>${titleHtml}</h3>
          </article>
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
