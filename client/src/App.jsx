import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadStatusType, setUploadStatusType] = useState("info");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(true);

  const endOfMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Chat request failed");
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: err?.message ?? "Chat request failed" }]);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:3001/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Upload failed");

      setUploadStatus("Document ingested successfully!");
      setUploadStatusType("success");
      setSelectedFile(null);
    } catch (err) {
      setUploadStatus(err?.message ?? "Upload failed");
      setUploadStatusType("error");
    } finally {
      setUploading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="shell">
      {/* ─── Sidebar ─── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-top">
          <div className="logo">
            <div className="logo-icon">⬡</div>
            {sidebarOpen && <span className="logo-text">Agentice</span>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {sidebarOpen && (
          <div className="sidebar-section">
            <p className="sidebar-label">About</p>
            <p className="sidebar-info">
              Upload PDF documents to your knowledge base, then ask questions and get AI-powered answers.
            </p>
          </div>
        )}
      </aside>

      {/* ─── Main Chat ─── */}
      <main className="chat-area">
        <div className="chat-header">
          {!sidebarOpen && (
            <button className="toggle-btn-inline" onClick={() => setSidebarOpen(true)}>⬡</button>
          )}
          <div className="chat-title">Personal Assistant</div>

          {/* PDF Panel Toggle Button */}
          <button
            className={`pdf-toggle-btn ${pdfPanelOpen ? "panel-open" : ""}`}
            onClick={() => setPdfPanelOpen(!pdfPanelOpen)}
          >
            <span>📄</span>
            {pdfPanelOpen ? "Hide PDF Panel" : "Show PDF Panel"}
          </button>

          <div className="status-dot">
            <span className="dot" />
            Online
          </div>
        </div>

        <div className="messages-wrap">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h2>How can I help you?</h2>
              <p>Upload a PDF to your knowledge base, then start asking questions.</p>
              <div className="suggestions">
                {["Summarize my document", "What are the key points?", "Find specific information"].map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              <div className="msg-avatar">
                {m.role === "user" ? "U" : "⬡"}
              </div>
              <div className="msg-bubble">
                {m.role === "ai" ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row ai">
              <div className="msg-avatar">⬡</div>
              <div className="msg-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        <div className="composer-wrap">
          <div className="composer-box">
            <textarea
              ref={textareaRef}
              className="composer-input"
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e); }}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about your documents…"
              rows={1}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ↑
            </button>
          </div>
          <p className="composer-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>

      {/* ─── PDF Panel (right) ─── */}
      <aside className={`pdf-panel ${pdfPanelOpen ? "" : "hidden"}`}>
        <div className="pdf-panel-header">
          <span className="pdf-panel-title">📄 Knowledge Base</span>
          <button className="pdf-panel-close" onClick={() => setPdfPanelOpen(false)}>✕</button>
        </div>

        <div className="pdf-panel-body">
          <p className="pdf-panel-label">Upload Document</p>

          <div className="upload-zone">
            <div className="upload-icon">📄</div>
            <p className="upload-hint">Drop a PDF or click to browse</p>
            <label className="file-label" htmlFor="pdf-upload">
              {selectedFile ? selectedFile.name : "Choose PDF"}
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] ?? null);
                setUploadStatus(null);
              }}
            />
            <button
              className="upload-btn"
              onClick={uploadDocument}
              disabled={!selectedFile || uploading}
            >
              {uploading ? <span className="spinner" /> : "Upload & Ingest"}
            </button>
            {uploadStatus && (
              <div className={`upload-status ${uploadStatusType}`}>
                {uploadStatus}
              </div>
            )}
          </div>

          <p className="pdf-panel-label" style={{ marginTop: 4 }}>About</p>
          <p className="pdf-panel-info">
            Upload PDF documents to your knowledge base, then ask questions and get AI-powered answers.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default App;
