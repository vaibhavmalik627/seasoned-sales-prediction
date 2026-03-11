import { useEffect, useState } from "react";
import { clearAiChatHistory, fetchAiChat, fetchAiChatHistory } from "../api/client.js";

const starterPrompts = [
  "What should I stock more next month?",
  "Which items look risky right now?",
  "Explain the latest forecast in simple terms.",
];

function ForecastChatAssistant({ item, store, reportContext = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setBootstrapping(true);
        const result = await fetchAiChatHistory();
        setMessages(result.messages || []);
      } catch (requestError) {
        setMessages([
          {
            role: "assistant",
            content: requestError.response?.data?.error || requestError.message,
          },
        ]);
      } finally {
        setBootstrapping(false);
      }
    };

    loadHistory();
  }, []);

  const sendMessage = async (content) => {
    if (!content.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content, createdAt: new Date().toISOString() }];
    setMessages(nextMessages);
    setInput("");

    try {
      setLoading(true);
      const result = await fetchAiChat({
        messages: nextMessages,
        item: item || undefined,
        store: store || undefined,
        reportContext,
      });
      setMessages((current) => [...current, { role: "assistant", content: result.answer || "", createdAt: new Date().toISOString() }]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: requestError.response?.data?.error || requestError.message, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleClear = async () => {
    try {
      setLoading(true);
      const result = await clearAiChatHistory();
      setMessages(result.messages || []);
    } catch (requestError) {
      setMessages([
        {
          role: "assistant",
          content: requestError.response?.data?.error || requestError.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Ask Forecast AI</p>
          <h3>Conversational Forecast Assistant</h3>
        </div>
        <button type="button" className="button button-secondary" onClick={handleClear} disabled={loading}>
          Clear Chat
        </button>
      </div>
      <div className="chat-sample-row">
        {starterPrompts.map((prompt) => (
          <button key={prompt} type="button" className="ask-chip" onClick={() => sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="chat-thread">
        {bootstrapping && <p className="status">Loading chat history...</p>}
        {!bootstrapping && messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`chat-bubble chat-${message.role}`}>
            <strong>{message.role === "assistant" ? "AI" : "You"}</strong>
            <p>{message.content}</p>
          </article>
        ))}
        {loading && !bootstrapping && <p className="status">Forecast AI is thinking...</p>}
      </div>
      <form className="ask-data-form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          placeholder="Ask a follow-up question..."
        />
        <button type="submit" className="button button-primary" disabled={loading || bootstrapping || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

export default ForecastChatAssistant;
