const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('chatInput');
const resetBtn = document.getElementById('resetBtn');

let sessionId = localStorage.getItem('sessionId') || null;

function addMessage(text, cls) {
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addCard(el) {
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderQueryDatabase(result) {
  const card = document.createElement('div');
  card.className = 'tool-card';

  if (result.error) {
    card.innerHTML = `<h3>Database</h3><p>${escapeHtml(result.error)}</p>`;
    return card;
  }

  if (result.type === 'group') {
    card.innerHTML = `<h3>Count by ${escapeHtml(result.groupBy)}</h3>`;
    const table = document.createElement('table');
    table.innerHTML = '<tr><th>Value</th><th>Count</th></tr>' +
      result.results.map((r) => `<tr><td>${escapeHtml(String(r._id))}</td><td>${r.count}</td></tr>`).join('');
    card.appendChild(table);
    return card;
  }

  card.innerHTML = `<h3>${escapeHtml(result.collection)} (${result.count})</h3>`;
  if (result.results.length === 0) {
    card.innerHTML += '<p>No results.</p>';
    return card;
  }
  const keys = Object.keys(result.results[0]).filter((k) => k !== '_id').slice(0, 6);
  const table = document.createElement('table');
  table.innerHTML =
    `<tr>${keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')}</tr>` +
    result.results.map((row) => `<tr>${keys.map((k) => `<td>${escapeHtml(String(row[k] ?? ''))}</td>`).join('')}</tr>`).join('');
  card.appendChild(table);
  return card;
}

function renderMovieList(title, results) {
  const card = document.createElement('div');
  card.className = 'tool-card';
  card.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
  if (!results || results.length === 0) {
    card.innerHTML += '<p>No movies found.</p>';
    return card;
  }
  const list = document.createElement('div');
  list.className = 'movie-list';
  for (const m of results) {
    const item = document.createElement('div');
    item.className = 'movie-card';
    item.innerHTML = `
      ${m.poster ? `<img src="${escapeHtml(m.poster)}" alt="${escapeHtml(m.title)} poster" loading="lazy" />` : ''}
      <div class="info">
        <b>${escapeHtml(m.title)} ${m.year ? `(${escapeHtml(String(m.year))})` : ''}</b>
        ${m.genre ? `${escapeHtml(m.genre)}<br/>` : ''}
        ${m.director ? `Dir: ${escapeHtml(m.director)}<br/>` : ''}
        ${m.rating ? `Rating: ${escapeHtml(String(m.rating))}<br/>` : ''}
        ${m.imdbRating ? `IMDb: ${escapeHtml(m.imdbRating)}<br/>` : ''}
        ${m.runtime ? `${escapeHtml(m.runtime)}<br/>` : ''}
        ${m.plot ? `<span>${escapeHtml(m.plot)}</span>` : ''}
      </div>`;
    list.appendChild(item);
  }
  card.appendChild(list);
  return card;
}

function renderJoke(result) {
  const card = document.createElement('div');
  card.className = 'tool-card joke-card';
  const upvotes = result.upvotes ?? 0;
  const downvotes = result.downvotes ?? 0;
  card.innerHTML = `
    <h3>Joke (${escapeHtml(result.category || '')})</h3>
    <p>${escapeHtml(result.text || '')}</p>
    <div class="rate-btns">
      <button data-vote="up">👍</button>
      <button data-vote="down">👎</button>
      <span class="counts">${upvotes} up / ${downvotes} down</span>
    </div>`;

  if (result.id) {
    card.querySelectorAll('button[data-vote]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await fetch(`/api/jokes/${result.id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote: btn.dataset.vote })
          });
          const countsEl = card.querySelector('.counts');
          const [up, down] = countsEl.textContent.match(/\d+/g).map(Number);
          countsEl.textContent = btn.dataset.vote === 'up' ? `${up + 1} up / ${down} down` : `${up} up / ${down + 1} down`;
        } catch {
          /* ignore rating errors, non-critical */
        }
      });
    });
  }
  return card;
}

function renderToolResult(toolName, result) {
  if (toolName === 'queryDatabase') return renderQueryDatabase(result);
  if (toolName === 'searchMovies') return renderMovieList('Search results', result.results || (result.error ? [] : []));
  if (toolName === 'getMovieDetails') return result.error ? errorCard(result.error) : renderMovieList(result.title || 'Movie', [result]);
  if (toolName === 'recommendMovies') return renderMovieList(`Recommended: ${result.genre}`, result.results);
  if (toolName === 'dadJoke') return renderJoke(result);
  const card = document.createElement('div');
  card.className = 'tool-card';
  card.innerHTML = `<h3>${escapeHtml(toolName)}</h3><pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  return card;
}

function errorCard(message) {
  const card = document.createElement('div');
  card.className = 'tool-card';
  card.innerHTML = `<p>${escapeHtml(message)}</p>`;
  return card;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  addMessage(text, 'user');

  const loading = addMessage('Thinking...', 'loading');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId })
    });
    const data = await res.json();
    loading.remove();

    if (!res.ok) {
      addMessage(data.error || 'Something went wrong.', 'error');
      return;
    }

    if (data.sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('sessionId', sessionId);
    }

    if (data.text) addMessage(data.text, 'bot');
    for (const tr of data.toolResults || []) {
      addCard(renderToolResult(tr.toolName, tr.result));
    }
  } catch (err) {
    loading.remove();
    addMessage('Network error: could not reach the server.', 'error');
  }
});

resetBtn.addEventListener('click', () => {
  sessionId = null;
  localStorage.removeItem('sessionId');
  messagesEl.innerHTML = '';
});
