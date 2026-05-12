const chatList = document.getElementById("chatList");
const messageInput = document.getElementById("messageInput");
const voiceToggleBtn = document.getElementById("voiceToggleBtn");
const sendToggleBtn = document.getElementById("sendToggleBtn");
const talkButton = document.getElementById("talkButton");
const imageInput = document.getElementById("imageInput");
const audioInput = document.getElementById("audioInput");
const clearDataBtn = document.getElementById("clearDataBtn");
const storageKey = "simpleChatMessages";

let messages = [];
let voiceMode = false;

function adjustTextareaHeight() {
  messageInput.style.height = "auto";
  const maxHeight = 140;
  const height = Math.min(messageInput.scrollHeight, maxHeight);
  messageInput.style.height = `${height}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? "auto" : "hidden";
}

function updateSendToggleButton() {
  const hasText = messageInput.value.trim().length > 0;
  if (voiceMode) {
    sendToggleBtn.textContent = "+";
    sendToggleBtn.classList.remove("send-mode");
    return;
  }
  if (hasText) {
    sendToggleBtn.textContent = "发送";
    sendToggleBtn.classList.add("send-mode");
  } else {
    sendToggleBtn.textContent = "+";
    sendToggleBtn.classList.remove("send-mode");
  }
}

function updateInputMode() {
  if (voiceMode) {
    messageInput.classList.add("hidden-input");
    talkButton.classList.add("active");
  } else {
    messageInput.classList.remove("hidden-input");
    talkButton.classList.remove("active");
  }
  adjustTextareaHeight();
  updateSendToggleButton();
}

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function saveMessages() {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function loadMessages() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    messages = JSON.parse(raw);
  } catch (error) {
    console.warn("无法读取已保存数据", error);
    messages = [];
  }
}

function addMessage({ type, text, src, filename, timestamp }) {
  const item = document.createElement("div");
  item.className = "chat-item";

  const meta = document.createElement("div");
  meta.className = "item-meta";
  meta.innerHTML = `<span>${type === "text" ? "文本" : type === "image" ? "图片" : "语音"}</span><span>${formatTime(new Date(timestamp))}</span>`;

  item.appendChild(meta);

  if (type === "text" && text) {
    const textNode = document.createElement("div");
    textNode.className = "item-text";
    textNode.textContent = text;
    item.appendChild(textNode);
  }

  if (type === "image" && src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = filename || "图片消息";
    item.appendChild(img);
  }

  if (type === "audio" && src) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = src;
    item.appendChild(audio);
  }

  chatList.appendChild(item);
}

function renderMessages() {
  chatList.innerHTML = "";
  messages.forEach(addMessage);
  chatList.scrollTop = chatList.scrollHeight;
}

function pushMessage(payload) {
  const message = {
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  };
  messages.push(message);
  saveMessages();
  renderMessages();
}

async function handleFileInput(input, type) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith(type)) return;

  const reader = new FileReader();
  reader.onload = () => {
    pushMessage({ type, src: reader.result, filename: file.name });
  };
  reader.readAsDataURL(file);
  input.value = "";
}

sendToggleBtn.addEventListener("click", () => {
  if (voiceMode) return;
  const text = messageInput.value.trim();
  if (!text) return;
  pushMessage({ type: "text", text });
  messageInput.value = "";
  adjustTextareaHeight();
  updateSendToggleButton();
  messageInput.focus();
});

messageInput.addEventListener("input", () => {
  adjustTextareaHeight();
  updateSendToggleButton();
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendToggleBtn.click();
  }
});

voiceToggleBtn.addEventListener("click", () => {
  voiceMode = !voiceMode;
  updateInputMode();
});

imageInput.addEventListener("change", () => handleFileInput(imageInput, "image"));
audioInput.addEventListener("change", () => handleFileInput(audioInput, "audio"));

clearDataBtn.addEventListener("click", () => {
  if (!confirm("确认要清空所有聊天记录？")) return;
  messages = [];
  saveMessages();
  renderMessages();
});

loadMessages();
renderMessages();
updateInputMode();
updateSendToggleButton();
