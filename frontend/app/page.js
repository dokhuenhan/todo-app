"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch {
      setError("Khong the ket noi den server");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>{isLogin ? "Chao mung tro lai" : "Tao tai khoan"}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Dang nhap de tiep tuc" : "Dang ky tai khoan moi"}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Ten</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhap ten cua ban"
                required
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Mat khau</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhap mat khau"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="auth-btn" type="submit">
            {isLogin ? "Dang nhap" : "Dang ky"}
          </button>
        </form>
        <p className="switch-auth">
          {isLogin ? "Chua co tai khoan? " : "Da co tai khoan? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }}>
            {isLogin ? "Dang ky ngay" : "Dang nhap"}
          </button>
        </p>
      </div>
    </div>
  );
}

function TodoApp({ user, token, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/todos`, { headers });
      const data = await res.json();
      if (res.ok) setTodos(data);
    } catch (err) {
      console.error("Loi ket noi server:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`${API_URL}/api/todos`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    });
    const newTodo = await res.json();
    setTodos([newTodo, ...todos]);
    setTitle("");
  };

  const handleToggle = async (todo) => {
    const res = await fetch(`${API_URL}/api/todos/${todo.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ completed: !todo.completed }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/todos/${id}`, { method: "DELETE", headers });
    setTodos(todos.filter((t) => t.id !== id));
  };

  const handleEditStart = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleEditSave = async (id) => {
    if (!editingTitle.trim()) return;
    const res = await fetch(`${API_URL}/api/todos/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ title: editingTitle.trim() }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
    setEditingTitle("");
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === "Enter") handleEditSave(id);
    if (e.key === "Escape") { setEditingId(null); setEditingTitle(""); }
  };

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ? true :
      filter === "active" ? !todo.completed :
      todo.completed;
    return matchesSearch && matchesFilter;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="app-header">
        <h1>Todo App</h1>
        <div className="user-info">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="user-name">{user.name}</div>
          </div>
          <button className="logout-btn" onClick={onLogout}>Dang xuat</button>
        </div>
      </div>

      {todos.length > 0 && (
        <>
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-number">{todos.length}</div>
              <div className="stat-label">Tong cong</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{activeCount}</div>
              <div className="stat-label">Dang lam</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{completedCount}</div>
              <div className="stat-label">Hoan thanh</div>
            </div>
          </div>

          <div className="progress-wrapper">
            <div className="progress-header">
              <span>Tien do</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </>
      )}

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Them viec can lam..."
        />
        <button type="submit">Them</button>
      </form>

      {todos.length > 0 && (
        <>
          <div className="search-bar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tim kiem..."
            />
          </div>

          <div className="filter-bar">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Tat ca
            </button>
            <button
              className={`filter-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Dang lam
            </button>
            <button
              className={`filter-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Hoan thanh
            </button>
          </div>
        </>
      )}

      {todos.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">+</div>
          <p>Chua co viec nao.</p>
          <p>Them viec moi phia tren!</p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty">
          <p>Khong tim thay viec nao.</p>
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
              {editingId === todo.id ? (
                <input
                  className="edit-input"
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                  onBlur={() => handleEditSave(todo.id)}
                  autoFocus
                />
              ) : (
                <span
                  className={`title ${todo.completed ? "completed" : ""}`}
                  onDoubleClick={() => handleEditStart(todo)}
                >
                  {todo.title}
                </span>
              )}
              {editingId !== todo.id && (
                <div className="todo-actions">
                  <button className="edit-btn" onClick={() => handleEditStart(todo)}>Sua</button>
                  <button className="delete-btn" onClick={() => handleDelete(todo.id)}>Xoa</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setChecking(false);
  }, []);

  const handleLogin = (user, token) => {
    setUser(user);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  if (checking) return null;

  if (!user) return <AuthForm onLogin={handleLogin} />;

  return <TodoApp user={user} token={token} onLogout={handleLogout} />;
}
