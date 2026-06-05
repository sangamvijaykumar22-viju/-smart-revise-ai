document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const chatForm = document.getElementById('chat-form');
    const messagesWrapper = document.getElementById('messages-wrapper');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatContainer = document.getElementById('chat-container');
    const newChatBtn = document.getElementById('new-chat-btn');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    const chatHistoryList = document.getElementById('chat-history-list');
    const attachmentBtn = document.querySelector('.attachment-btn');
    const fileInput = document.getElementById('chat-file-input');
    const attachmentPreview = document.getElementById('attachment-preview');
    const fileNameDisplay = document.getElementById('file-name-display');
    const removeAttachmentBtn = document.getElementById('remove-attachment');

    // State
    let conversationHistory = [];
    let currentChatId = null;
    let abortController = null;
    let selectedFile = null;

    // --- Persistence Logic ---

    const loadChats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return [];

        try {
            const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + '/api/chat/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('Error loading chats:', error);
            return [];
        }
    };

    const updateRecentChatsUI = async () => {
        const chats = await loadChats();
        chatHistoryList.innerHTML = '';

        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `chat-history-item ${chat.id === currentChatId ? 'active' : ''}`;
            li.innerHTML = `
                <div class="chat-item-click-area d-flex align-items-center flex-grow-1 overflow-hidden">
                    <i class="bi bi-chat-left-text me-2"></i>
                    <span class="text-truncate">${escapeHTML(chat.title)}</span>
                </div>
                <button class="delete-chat-btn border-0 bg-transparent ms-2">
                    <i class="bi bi-trash3"></i>
                </button>
            `;

            // Click area to load conversation
            li.querySelector('.chat-item-click-area').addEventListener('click', () => loadConversation(chat.id));
            
            // Delete button
            li.querySelector('.delete-chat-btn').addEventListener('click', (e) => chatDeleteChat(e, chat.id));

            chatHistoryList.appendChild(li);
        });
    };

    const loadConversation = async (chatId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/chat/${chatId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return;
            const chat = await response.json();

            currentChatId = chatId;
            conversationHistory = chat.messages;

            // UI Updates
            messagesWrapper.innerHTML = '';
            welcomeScreen.style.display = 'none';

            conversationHistory.forEach(msg => {
                if (msg.role === 'user') {
                    appendUserMessage(msg.content, false);
                } else {
                    appendAiMessage(msg.content, false);
                }
            });

            updateRecentChatsUI();
            scrollToBottom();

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    // --- Core Functions ---

    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim() !== '') {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Enter to submit (Shift+Enter for newline)
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Mobile sidebar toggle
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Handle suggestion cards
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            sendBtn.removeAttribute('disabled');
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    // File Attachment Logic
    attachmentBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are supported.');
                fileInput.value = '';
                return;
            }
            selectedFile = file;
            fileNameDisplay.textContent = file.name;
            attachmentPreview.classList.remove('d-none');
            attachmentBtn.classList.add('active');
            sendBtn.removeAttribute('disabled');
        }
    });

    removeAttachmentBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('d-none');
        attachmentBtn.classList.remove('active');
        if (chatInput.value.trim() === '') {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // New Chat
    newChatBtn.addEventListener('click', async () => {
        currentChatId = null;
        conversationHistory = [];
        messagesWrapper.innerHTML = '';
        welcomeScreen.style.display = 'flex';
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        await updateRecentChatsUI();
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    // Pre-defined logic for responsiveness
    const getNexusResponse = async (input, file = null, onChunk = null) => {
        const token = localStorage.getItem('token');
        if (!token) return "Unauthorized: Please log in.";

        abortController = new AbortController();

        try {
            if (file) {
                // Files don't support streaming easily in this architecture, fall back to non-stream
                let body = new FormData();
                body.append('content', input || "Analyze this PDF");
                if (currentChatId) body.append('chat_id', currentChatId);
                body.append('file', file);

                const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + '/api/chat/message', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: body,
                    signal: abortController.signal
                });
                const data = await response.json();
                if (!currentChatId) currentChatId = data.chat_id;
                updateRecentChatsUI();
                return data.response;
            }

            // Stream Text-only messages
            const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + '/api/chat/message/stream', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: input, chat_id: currentChatId }),
                signal: abortController.signal
            });

            if (!response.ok) throw new Error("Stream connection failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                
                // Handle Metadata chunk
                if (chunk.startsWith("METADATA:")) {
                    const metaStr = chunk.split("\n")[0].replace("METADATA:", "");
                    const meta = JSON.parse(metaStr);
                    currentChatId = meta.chat_id;
                    updateRecentChatsUI();
                    continue;
                }

                fullText += chunk;
                if (onChunk) onChunk(fullText);
            }

            return fullText;
        } catch (error) {
            if (error.name === 'AbortError') return "Generation stopped.";
            throw error;
        } finally {
            abortController = null;
        }
    };


    const appendUserMessage = (text, scroll = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message user';
        msgDiv.innerHTML = `
            <div class="message-content">${escapeHTML(text).replace(/\n/g, '<br>')}</div>
        `;
        messagesWrapper.appendChild(msgDiv);
        if (scroll) scrollToBottom();
    };

    const appendAiTypingIndicator = () => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai ai-typing';
        msgDiv.id = 'typing-indicator';
        msgDiv.innerHTML = `
            <div class="ai-avatar"><i class="bi bi-robot"></i></div>
            <div class="ai-text">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messagesWrapper.appendChild(msgDiv);
        scrollToBottom();
        return msgDiv;
    };

    // ============================================================
    // ChatGPT-Style Markdown + JSON Parser (Placeholder-Based)
    // This approach extracts code blocks FIRST before rendering prose
    // so raw `###`, backticks, etc. never leak into the output.
    // ============================================================
    const parseMarkdown = (text) => {
        if (!text) return "";

        // --- 1. Handle structured JSON arrays (notes format) ---
        const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    const before = text.substring(0, jsonMatch.index).trim();
                    let out = before ? `<p>${escInline(before)}</p>` : '';
                    parsed.forEach(item => {
                        out += `<div class="ai-note-card"><h6>${item.title || 'Note'}</h6><p>${item.content || item.text || ''}</p></div>`;
                    });
                    return out;
                }
            } catch (e) { /* not valid JSON, continue */ }
        }

        // --- 2. Extract triple-backtick code blocks into placeholders ---
        const codeBlocks = [];
        let processed = text.replace(/```(\w*)[^\S\r\n]*([\s\S]*?)```/g, (match, lang, code) => {
            const trimmedLang = (lang || '').trim().toLowerCase();
            const trimmedCode = code.trim();

            // Intercept ```json blocks — try to render as note cards instead
            if (trimmedLang === 'json') {
                try {
                    const parsed = JSON.parse(trimmedCode);
                    if (Array.isArray(parsed)) {
                        let cards = '';
                        parsed.forEach(item => {
                            if (item.title || item.content) {
                                cards += `<div class="ai-note-card"><h6>${item.title || 'Note'}</h6><p>${item.content || item.text || ''}</p></div>`;
                            }
                        });
                        if (cards) {
                            codeBlocks.push({ lang: '__NOTE_CARDS__', rendered: cards });
                            return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
                        }
                    } else if (typeof parsed === 'object') {
                        // Single object — render key-value pairs
                        let cards = '';
                        Object.entries(parsed).forEach(([key, val]) => {
                            cards += `<div class="ai-note-card"><h6>${key}</h6><p>${typeof val === 'string' ? val : JSON.stringify(val)}</p></div>`;
                        });
                        if (cards) {
                            codeBlocks.push({ lang: '__NOTE_CARDS__', rendered: cards });
                            return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
                        }
                    }
                } catch(e) { /* not valid JSON, fall through to show as code */ }
            }

            codeBlocks.push({ lang: trimmedLang || 'plaintext', code: trimmedCode });
            return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
        });

        // --- 3. Extract inline code into placeholders ---
        const inlineCodes = [];
        processed = processed.replace(/`([^`\n]+)`/g, (match, code) => {
            inlineCodes.push(escapeHTML(code));
            return `\x00INLINE${inlineCodes.length - 1}\x00`;
        });

        // --- 4. Render prose ---
        // Headers
        processed = processed.replace(/^#{4}\s+(.+)$/mg, '<h6>$1</h6>');
        processed = processed.replace(/^#{3}\s+(.+)$/mg, '<h5>$1</h5>');
        processed = processed.replace(/^#{2}\s+(.+)$/mg, '<h5 style="font-size:1.1rem">$1</h5>');
        processed = processed.replace(/^#\s+(.+)$/mg, '<h5 style="font-size:1.2rem">$1</h5>');
        // Bold & italic
        processed = processed.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        // Lists
        processed = processed.replace(/^[\t ]*[-*]\s+(.+)$/mg, '<li>$1</li>');
        processed = processed.replace(/^[\t ]*\d+\.\s+(.+)$/mg, '<li>$1</li>');
        processed = processed.replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>');
        // Paragraphs
        const paragraphs = processed.split(/\n{2,}/);
        processed = paragraphs.map(p => {
            p = p.replace(/\n/g, '<br>').trim();
            if (!p) return '';
            const isBlock = p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<li') || p.startsWith('<div') || p.startsWith('\x00CODEBLOCK');
            return isBlock ? p : `<p>${p}</p>`;
        }).filter(Boolean).join('');

        // --- 5. Restore inline code ---
        inlineCodes.forEach((code, idx) => {
            processed = processed.replace(`\x00INLINE${idx}\x00`, `<code>${code}</code>`);
        });

        // --- 6. Restore code blocks with premium UI ---
        codeBlocks.forEach((block, idx) => {
            let codeHtml;

            // If it was a JSON array → render as note cards
            if (block.lang === '__NOTE_CARDS__') {
                codeHtml = block.rendered;
            } else {
                const { lang, code } = block;
                const displayLang = (!lang || lang === 'plaintext') ? 'Code' : lang.charAt(0).toUpperCase() + lang.slice(1);
                let highlighted = escapeHTML(code);
                try {
                    if (window.hljs) {
                        const result = lang && lang !== 'plaintext' && hljs.getLanguage(lang)
                            ? hljs.highlight(code, { language: lang, ignoreIllegals: true })
                            : hljs.highlightAuto(code);
                        highlighted = result.value;
                    }
                } catch(e) { highlighted = escapeHTML(code); }

                codeHtml = `<div class="code-window">
                    <div class="code-header">
                        <span class="code-lang">${displayLang}</span>
                        <div class="code-actions">
                            <button class="btn-code-action" onclick="chatCopyCode(this)"><i class="bi bi-copy"></i> Copy</button>
                        </div>
                    </div>
                    <pre class="code-body"><code class="hljs">${highlighted}</code></pre>
                </div>`;
            }

            processed = processed.replace(`\x00CODEBLOCK${idx}\x00`, codeHtml);
        });

        return processed;
    };

    const escInline = (text) => text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Delete a chat conversation
    window.chatDeleteChat = async (e, chatId) => {
        e.stopPropagation(); // Prevent loading the chat when clicking delete
        
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5050' : 'https://smart-revise-ai-m3u6.onrender.com') + `/api/chat/${chatId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (currentChatId === chatId) {
                    // Reset UI if deleted the current chat
                    currentChatId = null;
                    conversationHistory = [];
                    messagesWrapper.innerHTML = '';
                    welcomeScreen.style.display = 'flex';
                }
                updateRecentChatsUI();
            } else {
                alert('Failed to delete chat.');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error deleting chat. Please try again.');
        }
    };

    // Copy code from chat code block
    window.chatCopyCode = (btn) => {
        const code = btn.closest('.code-window').querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(() => btn.innerHTML = orig, 2000);
        });
    };

    const appendAiMessage = (text, scroll = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai';
        msgDiv.innerHTML = `
            <div class="ai-avatar"><i class="bi bi-robot"></i></div>
            <div class="ai-text">${parseMarkdown(text)}</div>
        `;
        messagesWrapper.appendChild(msgDiv);
        // Re-run hljs on any new code blocks not already highlighted
        if (window.hljs) {
            msgDiv.querySelectorAll('pre code:not(.hljs)').forEach(block => {
                hljs.highlightElement(block);
            });
        }
        if (scroll) scrollToBottom();
    };

    const escapeHTML = (str) => {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    };

    const scrollToBottom = () => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    };

    // Handle stop button
    stopBtn.addEventListener('click', () => {
        if (abortController) {
            abortController.abort();
        }
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg && !selectedFile) return;

        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
        }

        const displayMsg = selectedFile ? (msg ? `${msg} (Attached: ${selectedFile.name})` : `Attached: ${selectedFile.name}`) : msg;
        appendUserMessage(displayMsg);

        const currentMsg = msg; // Store current message before clearing

        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        // Clear attachment preview
        const currentFile = selectedFile;
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('d-none');
        attachmentBtn.classList.remove('active');

        // Toggle Buttons
        sendBtn.classList.add('d-none');
        stopBtn.classList.remove('d-none');

        const typingEl = appendAiTypingIndicator();
        
        // Create an empty AI message div for streaming
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'chat-message ai d-none'; // Hidden initially
        aiMsgDiv.innerHTML = `
            <div class="ai-avatar"><i class="bi bi-robot"></i></div>
            <div class="ai-text"></div>
        `;
        messagesWrapper.appendChild(aiMsgDiv);
        const aiTextEl = aiMsgDiv.querySelector('.ai-text');

        // Get AI response (Streaming)
        getNexusResponse(currentMsg, currentFile, (text) => {
            if (typingEl) typingEl.remove();
            aiMsgDiv.classList.remove('d-none');
            aiTextEl.innerHTML = parseMarkdown(text);
            
            // Highlight code blocks in real-time
            if (window.hljs) {
                aiTextEl.querySelectorAll('pre code:not(.hljs)').forEach(block => {
                    hljs.highlightElement(block);
                });
            }
            scrollToBottom();
        }).then(res => {
            if (typingEl) typingEl.remove();
            aiMsgDiv.classList.remove('d-none');
            aiTextEl.innerHTML = parseMarkdown(res);
        }).catch(err => {
            if (typingEl) typingEl.remove();
            if (err.name !== 'AbortError') {
                appendAiMessage("Sorry, I encountered an error. Please try again later.");
            }
        }).finally(() => {
            stopBtn.classList.add('d-none');
            sendBtn.classList.remove('d-none');
        });
    });

    // Initialize UI
    updateRecentChatsUI();
});
