const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const resetBtn = document.getElementById('reset-btn');
const chips = document.querySelectorAll('.chip');

// Array riwayat percakapan yang dikirim ke backend
let conversation = [];

// Pesan pembuka / welcome message dari Triva
const WELCOME_MESSAGE = `Halo travelers! 👋 Saya **Triva**, konsultan perjalanan pribadi Anda dengan pengalaman lebih dari 10 tahun ✈️🌴.

Mau merencanakan liburan ke mana dan untuk berapa hari? Ceritakan impian liburan Anda atau klik salah satu rekomendasi cepat di bawah ini, dan saya siap buatkan itinerary lengkap serta tips terbaiknya! ✨`;

// Inisialisasi awal obrolan
function initChat() {
  chatBox.innerHTML = '';
  conversation = [];
  appendBotMessage(WELCOME_MESSAGE);
}

// Formatter Markdown sederhana (Bold, Italic, Headings, List, Newlines)
function formatMarkdown(text) {
  const div = document.createElement('div');
  div.textContent = text;
  let safe = div.innerHTML;

  // Bold (**teks** atau __teks__)
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (*teks* atau _teks_)
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Headings
  safe = safe.replace(/^### (.*$)/gim, '<h4 class="chat-heading">$1</h4>');
  safe = safe.replace(/^## (.*$)/gim, '<h3 class="chat-heading">$1</h3>');

  // Lists (* item atau - item)
  safe = safe.replace(/^\s*[-*]\s+(.*)$/gim, '<li class="chat-li">$1</li>');
  safe = safe.replace(/(<li class="chat-li">.*?<\/li>)+/gims, '<ul class="chat-ul">$&</ul>');

  // Newline to br
  safe = safe.replace(/\n/g, '<br/>');

  // Clean-up redundant tags
  safe = safe.replace(/<br\/><ul/g, '<ul').replace(/<\/ul><br\/>/g, '</ul>');
  safe = safe.replace(/<br\/><h/g, '<h').replace(/<\/h[34]><br\/>/g, '');

  return safe;
}

// Tampilkan pesan pengguna
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '👤';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  row.appendChild(bubble);
  row.appendChild(avatar);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Tampilkan pesan bot (dengan format Markdown)
function appendBotMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row bot';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '✈️';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = formatMarkdown(text);

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

// Tampilkan indikator "Thinking..." dengan animasi bouncing dots
function appendThinkingMessage() {
  const row = document.createElement('div');
  row.className = 'message-row bot';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '✈️';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = `
    <div class="typing-container">
      <span>Triva sedang menyusun rencana...</span>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

// Handler pengiriman pesan
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Tampilkan pesan user di chat box
  appendUserMessage(userMessage);
  input.value = '';

  // 2. Simpan ke riwayat percakapan
  conversation.push({ role: 'user', text: userMessage });

  // 3. Tampilkan status bot "Thinking..."
  const thinkingBubble = appendThinkingMessage();

  // Nonaktifkan form sementara
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    // 4. Kirim request ke backend /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Ganti animasi "Thinking..." dengan respon AI
    if (data && data.result) {
      thinkingBubble.innerHTML = formatMarkdown(data.result);
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingBubble.textContent = 'Maaf, tidak ada respon yang diterima.';
      conversation.pop();
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    thinkingBubble.textContent = 'Gagal mendapatkan respon dari server. Pastikan server backend sedang berjalan.';
    conversation.pop();
  } finally {
    // Aktifkan kembali input dan tombol
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

// Handler saat klik quick suggestion chip
chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const text = chip.getAttribute('data-text');
    if (!text || input.disabled) return;
    input.value = text;
    form.requestSubmit();
  });
});

// Handler tombol reset obrolan
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    initChat();
  });
}

// Jalankan inisialisasi awal saat halaman dibuka
initChat();
