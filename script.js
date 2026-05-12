const chatList = document.getElementById("chatList");
const messageInput = document.getElementById("messageInput");
const recordBtn = document.getElementById("recordBtn");
const emojiBtn = document.getElementById("emojiBtn");
const sendToggleBtn = document.getElementById("sendToggleBtn");
const plusPanel = document.getElementById("plusPanel");
const emojiPanel = document.getElementById("emojiPanel");
const imageInput = document.getElementById("imageInput");
const cameraInput = document.getElementById("cameraInput");
const clearDataBtn = document.getElementById("clearDataBtn");
const storageKey = "simpleChatMessages";

let messages = [];
let mediaRecorder = null;
let recorderStream = null;
let isRecording = false;
let recordTimeout = null;
const RECORD_START_DELAY = 300;

function adjustTextareaHeight() {
  messageInput.style.height = "auto";
  const maxHeight = 140;
  const height = Math.min(messageInput.scrollHeight, maxHeight);
  messageInput.style.height = `${height}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? "auto" : "hidden";
}

function closePanels() {
  plusPanel.classList.remove("active");
  plusPanel.setAttribute("aria-hidden", "true");
  emojiPanel.classList.remove("active");
  emojiPanel.setAttribute("aria-hidden", "true");
}

function setRecordingState(active) {
  isRecording = active;
  recordBtn.classList.toggle("recording", active);
  recordBtn.textContent = active ? "🎙 录音中" : "🎙";
}

function updateSendToggleButton() {
  const hasText = messageInput.value.trim().length > 0;
  if (hasText) {
    sendToggleBtn.textContent = "发送";
    sendToggleBtn.classList.add("send-mode");
  } else {
    sendToggleBtn.textContent = "+";
    sendToggleBtn.classList.remove("send-mode");
  }
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("当前浏览器不支持录音功能。");
    return;
  }

  try {
    recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(recorderStream);
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        pushMessage({ type: "audio", src: reader.result, filename: "录音.webm" });
      };
      reader.readAsDataURL(blob);
      recorderStream.getTracks().forEach((track) => track.stop());
      recorderStream = null;
      mediaRecorder = null;
      setRecordingState(false);
    };

    mediaRecorder.start();
    setRecordingState(true);
  } catch (error) {
    console.error(error);
    alert("录音权限被拒绝或设备不可用。请检查浏览器权限设置。");
  }
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  mediaRecorder.stop();
}

window.addEventListener("beforeunload", () => {
  if (recorderStream) {
    recorderStream.getTracks().forEach((track) => track.stop());
  }
});

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
  const text = messageInput.value.trim();
  if (text) {
    pushMessage({ type: "text", text });
    messageInput.value = "";
    adjustTextareaHeight();
    updateSendToggleButton();
    closePanels();
    messageInput.focus();
    return;
  }

  const open = !plusPanel.classList.contains("active");
  closePanels();
  if (open) {
    plusPanel.classList.add("active");
    plusPanel.setAttribute("aria-hidden", "false");
  }
});

emojiBtn.addEventListener("click", () => {
  const open = !emojiPanel.classList.contains("active");
  closePanels();
  if (open) {
    emojiPanel.classList.add("active");
    emojiPanel.setAttribute("aria-hidden", "false");
  }
});

messageInput.addEventListener("input", () => {
  adjustTextareaHeight();
  updateSendToggleButton();
  if (messageInput.value.trim().length > 0) {
    plusPanel.classList.remove("active");
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendToggleBtn.click();
  }
});

recordBtn.addEventListener("mousedown", (event) => {
  event.preventDefault();
  recordTimeout = setTimeout(() => startRecording(), RECORD_START_DELAY);
});

recordBtn.addEventListener("touchstart", (event) => {
  event.preventDefault();
  recordTimeout = setTimeout(() => startRecording(), RECORD_START_DELAY);
});

document.addEventListener("mouseup", () => {
  clearTimeout(recordTimeout);
  stopRecording();
});

document.addEventListener("touchend", () => {
  clearTimeout(recordTimeout);
  stopRecording();
});

document.addEventListener("touchcancel", () => {
  clearTimeout(recordTimeout);
  stopRecording();
});

recordBtn.addEventListener("mouseleave", () => {
  if (!isRecording) {
    clearTimeout(recordTimeout);
  }
});

imageInput.addEventListener("change", () => handleFileInput(imageInput, "image"));
cameraInput.addEventListener("change", () => handleFileInput(cameraInput, "image"));

emojiPanel.addEventListener("click", (event) => {
  const emojiButton = event.target.closest(".emoji-option");
  if (!emojiButton) return;
  const emoji = emojiButton.textContent;
  const start = messageInput.selectionStart;
  const end = messageInput.selectionEnd;
  const value = messageInput.value;
  messageInput.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  messageInput.focus();
  messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
  adjustTextareaHeight();
  updateSendToggleButton();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.closest(".panel-group") && !target.closest(".emoji-panel") && target !== emojiBtn) {
    closePanels();
  }
});

document.querySelectorAll(".panel-action[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "file") {
      alert("文件功能待扩展，可在这里添加上传文档逻辑。");
    }
    if (action === "location") {
      alert("位置功能待扩展，可在这里添加位置分享逻辑。");
    }
    closePanels();
  });
});

clearDataBtn.addEventListener("click", () => {
  if (!confirm("确认要清空所有聊天记录？")) return;
  messages = [];
  saveMessages();
  renderMessages();
});

loadMessages();
renderMessages();
updateSendToggleButton();
