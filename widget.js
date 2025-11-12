(() => {
  const webhookUrl = "https://n8n-dev.inticousa.com/webhook/2a9d7cbf-f0de-4395-9614-127b1f3105bb"; // <-- reemplaza con tu webhook de n8n

  const $ = id => document.getElementById(id);
  const widget = $("intico-widget");
  const chatIcon = $("chat-icon");
  const messages = $("messages");
  const textInput = $("text-input");
  const sendTextBtn = $("send-text");
  const recordBtn = $("record-btn");
  const recordStatus = $("record-status");

  // --- Mostrar/Ocultar widget ---
  chatIcon.addEventListener("click", () => {
    widget.classList.add("visible");
    widget.classList.remove("hidden");
    chatIcon.style.display = "none";
  });

  $("close-widget").addEventListener("click", () => {
    widget.classList.remove("visible");
    setTimeout(() => {
      widget.classList.add("hidden");
      chatIcon.style.display = "flex";
    }, 300);
  });

  // --- Chat funcionalidad ---
  function pushMessage(text, cls = "me") {
    const div = document.createElement("div");
    div.className = `message ${cls}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendText(text) {
    if (!text || !text.trim()) return;
    pushMessage(text, "me");
    textInput.value = "";

    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        mode: "cors",
      });

      const raw = await resp.text(); // ← respuesta en texto plano
      console.log("🧾 Respuesta RAW del webhook:", raw);
      pushMessage(raw || "Mensaje enviado.", "bot"); // ← mostramos texto directo
    } catch (err) {
      console.error(err);
      pushMessage("Error al enviar.", "bot");
    }
  }

  sendTextBtn.addEventListener("click", () => sendText(textInput.value));
  textInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendText(textInput.value);
    }
  });

  // --- Audio recording ---
  let mediaRecorder = null;
  let audioChunks = [];

  recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          await sendAudio(blob);
        };
        mediaRecorder.start();
        recordStatus.textContent = "Grabando...";
        recordBtn.textContent = "Detener";
      } catch (err) {
        pushMessage("No se pudo acceder al micrófono.", "bot");
      }
    } else {
      mediaRecorder.stop();
      recordStatus.textContent = "Procesando...";
      recordBtn.textContent = "Audio";
      setTimeout(() => (recordStatus.textContent = "—"), 1500);
    }
  });

  async function sendAudio(blob) {
    pushMessage("[Audio enviado]", "me");
    const form = new FormData();
    form.append("audio", blob, "voice.webm");

    try {
      const resp = await fetch(webhookUrl, { method: "POST", body: form, mode: "cors" });
      const raw = await resp.text(); // ← respuesta en texto plano
      console.log("🧾 Respuesta RAW del webhook:", raw);
      pushMessage(raw || "Audio enviado.", "bot");
    } catch (err) {
      console.error(err);
      pushMessage("Error al enviar audio.", "bot");
    }
  }

  // Mensaje inicial
  pushMessage("Hola! Puedes enviar texto o grabar un mensaje de voz.", "bot");
})();

