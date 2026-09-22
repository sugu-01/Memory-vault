/* ============================================================
   Memory Vault — AI Assistant Script (assistant.js)
   Real-time chat with Gemini integration and conversation history.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initNav('AI Assistant');

  const messagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-chat-btn');
  const quickPromptBtns = document.querySelectorAll('.quick-prompt-btn');

  const conversationHistory = [];

  function appendMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = escapeHtml(content).replace(/\n/g, '<br/>');
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return bubble;
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.className = 'chat-bubble assistant typing-indicator';
    typing.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage('user', trimmed);
    conversationHistory.push({ role: 'user', content: trimmed });
    chatInput.value = '';
    showTypingIndicator();
    sendBtn.disabled = true;

    try {
      const res = await api.post('/ai/chat', {
        message: trimmed,
        conversationHistory: conversationHistory.slice(-10) // last 10 messages for context
      });

      removeTypingIndicator();
      const reply = res?.data?.reply || "I'm sorry, I couldn't generate a response.";
      appendMessage('assistant', reply);
      conversationHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      removeTypingIndicator();
      appendMessage('assistant', `⚠️ ${err.message || 'Error communicating with assistant. Please try again later.'}`);
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(chatInput.value);
  });

  quickPromptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.text);
    });
  });

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chatInput.focus();
});
