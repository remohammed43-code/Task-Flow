import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Calendar from "./pages/Calendar";

function getPriority(value) {
  return ["low", "medium", "high"].includes(value) ? value : "medium";
}

function getDaysDifference(dueDate) {
  if (!dueDate) return null;

  const [year, month, day] = dueDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(due.getTime()) ||
    due.getFullYear() !== year ||
    due.getMonth() !== month - 1 ||
    due.getDate() !== day
  ) {
    return null;
  }

  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function getTaskDeadlineStatus(task) {
  if (task.completed || !task.dueDate) {
    return null;
  }

  const days = getDaysDifference(task.dueDate);

  if (days === null) {
    return null;
  }

  if (days === 0) {
    return {
      text: "Due today",
      type: "today",
    };
  }

  if (days > 0) {
    return {
      text: `${days} ${days === 1 ? "day" : "days"} left`,
      type: "upcoming",
    };
  }

  return {
    text: `Overdue by ${Math.abs(days)} ${days === -1 ? "day" : "days"}`,
    type: "overdue",
  };
}

function TaskDeadlineStatus({ task }) {
  const status = getTaskDeadlineStatus(task);

  if (!status) return null;

  return (
    <span className={`deadline-status deadline-${status.type}`}>
      {status.text}
    </span>
  );
}

function App() {
  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((item) => item.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && item.completed) ||
        (filter === "pending" && !item.completed);

      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        item.text.toLowerCase().includes(searchTerm) ||
        (item.description || "").toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  function addTask() {
    if (task.trim() === "") {
      return;
    }

    setTasks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text: task.trim(),
        description: description.trim(),
        completed: false,
        dueDate,
        priority,
      },
    ]);

    setTask("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
  }

  function updatePriority(taskId, nextPriority) {
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, priority: nextPriority } : item
      )
    );
  }

  function toggleTask(taskId) {
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((item) => item.id !== taskId));
    if (editId === taskId) {
      setEditId(null);
      setEditText("");
    }
  }

  function saveEdit(taskId) {
    const trimmedValue = editText.trim();
    if (trimmedValue === "") {
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, text: trimmedValue } : item
      )
    );

    setEditId(null);
    setEditText("");
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <BrowserRouter>
      <Navbar search={search} setSearch={setSearch} />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <main className="app-shell">
                <section className="top-panel">
                  <div className="hero-card">
                    <p className="eyebrow">TaskFlow dashboard</p>
                    <h1>Organize your day with clarity.</h1>
                    <p className="subtitle">
                      Turn scattered tasks into a focused plan and keep momentum all day.
                    </p>
                  </div>

                  <div className="stats-grid">
                    <article className="stat-card accent">
                      <span>Total</span>
                      <strong>{totalTasks}</strong>
                    </article>
                    <article className="stat-card">
                      <span>Open</span>
                      <strong>{pendingTasks}</strong>
                    </article>
                    <article className="stat-card">
                      <span>Done</span>
                      <strong>{completedTasks}</strong>
                    </article>
                  </div>
                </section>

                <section className="composer-card">
                  <div className="panel-head">
                    <h2>New task</h2>
                    <span>{pendingTasks} open</span>
                  </div>

                  <form
                    className="task-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addTask();
                    }}
                  >
                    <label className="input-group input-wide">
                      <span>Task name</span>
                      <input
                        type="text"
                        value={task}
                        onChange={(event) => setTask(event.target.value)}
                        placeholder="Write down your next task"
                      />
                    </label>
                   <label className="input-group description-group">
                     <span>Description</span>
                     <textarea
                       className="description-input"
                       placeholder="Add a few details (optional)"
                       value={description}
                       onChange={(event) => setDescription(event.target.value)}
                       rows={3}
                     />
                   </label>
                    <label className="input-group">
                      <span>Due date</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                      />
                    </label>
                    <label className="input-group">
                      <span>Priority</span>
                      <select
                        className="priority-select"
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>

                    <button type="submit" className="primary-btn">
                      Add task
                    </button>
                  </form>
                </section>

                <section className="list-card">
                  <div className="panel-head panel-head-split">
                    <h2>Your tasks</h2>

                    <div className="filter-group" aria-label="Task filter options">
                      {[
                        { value: "all", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Done" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={filter === option.value ? "filter-btn active" : "filter-btn"}
                          onClick={() => setFilter(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>No tasks match your filter.</p>
                      <span>Try a different search or add a fresh priority.</span>
                    </div>
                  ) : (
                    <ul className="task-list">
                      {filteredTasks.map((item) => (
                        <li
                          className={`task-item priority-${getPriority(item.priority)}${item.completed ? " done" : ""}`}
                          key={item.id}
                        >
                          <button
                            type="button"
                            className={item.completed ? "check-button complete" : "check-button"}
                            onClick={() => toggleTask(item.id)}
                            aria-label={item.completed ? "Mark task as incomplete" : "Mark task as complete"}
                          >
                            {item.completed ? "✓" : ""}
                          </button>

                          {editId === item.id ? (
                            <div className="task-editor">
                              <input
                                type="text"
                                value={editText}
                                onChange={(event) => setEditText(event.target.value)}
                                className="edit-input"
                                autoFocus
                              />

                              <div className="inline-actions">
                                <button type="button" className="small-btn success" onClick={() => saveEdit(item.id)}>
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="small-btn secondary"
                                  onClick={() => {
                                    setEditId(null);
                                    setEditText("");
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="task-copy">
                                <p className={item.completed ? "task-text done" : "task-text"}>
                                  {item.text}
                                  <span className={`priority-badge priority-${getPriority(item.priority)}`}>
                                    {getPriority(item.priority)}
                                  </span>
                                </p>

                                {item.description && (
                                  <p className="task-description">{item.description}</p>
                                )}

                                {item.dueDate && (
                                  <div className="task-meta">
                                    <span className="due-chip">
                                      Due {formatDate(item.dueDate)}
                                    </span>
                                    <TaskDeadlineStatus task={item} />
                                  </div>
                                )}
                              </div>

                              <div className="item-actions">
                                <select
                                  className={`priority-select task-priority-select priority-${getPriority(item.priority)}`}
                                  value={getPriority(item.priority)}
                                  onChange={(event) => updatePriority(item.id, event.target.value)}
                                  aria-label={`Priority for ${item.text}`}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                                <button
                                  type="button"
                                  className="small-btn secondary"
                                  onClick={() => {
                                    setEditId(item.id);
                                    setEditText(item.text);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="small-btn danger"
                                  onClick={() => deleteTask(item.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </main>
            </>
          }
        />

        <Route path="/calendar" element={<Calendar tasks={tasks} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;