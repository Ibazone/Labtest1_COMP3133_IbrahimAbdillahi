// public/js/chat.js
const socket = io(); // Connect to WebSocket

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/login";
}

const sendBtn = document.getElementById("sendMessageBtn");
const roomSelect = document.getElementById("roomSelect");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const typingIndicator = document.getElementById("typingIndicator");

let typingTimer;

// Send message
sendBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  const room = roomSelect.value;
  const from_user = localStorage.getItem("username");

  if (!message) return;

  await fetch("/chat/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from_user, room, message }),
  });

  messageInput.value = "";
  socket.emit("stopTyping", { room });
});

// Listen for new messages in real-time (room-filtered)
socket.on("newMessage", (data) => {
  const currentRoom = roomSelect.value;
  if (data.room !== currentRoom) return;

  messagesDiv.innerHTML += `<p><strong>${data.from_user}:</strong> ${data.message}</p>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Load messages when the room changes
async function loadMessages(room) {
  const response = await fetch(`/chat/messages/${room}`);
  const messages = await response.json();

  messagesDiv.innerHTML = messages
    .map((msg) => `<p><strong>${msg.from_user}:</strong> ${msg.message}</p>`)
    .join("");

  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Join the room using Socket.io
  socket.emit("joinRoom", room);
}

// Change room
roomSelect.addEventListener("change", () => {
  const room = roomSelect.value;
  loadMessages(room);
});

// Load messages when page loads
window.onload = () => {
  const room = roomSelect.value;
  loadMessages(room);
};

// Typing indicator (required)
messageInput.addEventListener("input", () => {
  const room = roomSelect.value;
  const username = localStorage.getItem("username");

  socket.emit("typing", { room, username });

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit("stopTyping", { room });
  }, 700);
});

socket.on("typing", ({ username }) => {
  if (typingIndicator) typingIndicator.textContent = `${username} is typing...`;
});

socket.on("stopTyping", () => {
  if (typingIndicator) typingIndicator.textContent = "";
});
