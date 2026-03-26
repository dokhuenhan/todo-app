const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || "todo-app-secret-key-2024";

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://todo-app-three-beta-66.vercel.app",
  ],
  credentials: true,
}));
app.use(express.json());

// === Middleware xác thực ===
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Vui lòng đăng nhập" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// === AUTH ROUTES ===

// Đăng ký
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email đã được sử dụng" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Đăng nhập
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Vui lòng điền email và mật khẩu" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Lấy thông tin user hiện tại
app.get("/api/auth/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  res.json(user);
});

// === TODO ROUTES (cần đăng nhập) ===

// Lấy todos của user
app.get("/api/todos", auth, async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(todos);
});

// Tạo todo mới
app.post("/api/todos", auth, async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const todo = await prisma.todo.create({
    data: { title: title.trim(), userId: req.userId },
  });
  res.status(201).json(todo);
});

// Cập nhật todo
app.patch("/api/todos/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const todo = await prisma.todo.update({
    where: { id: Number(id), userId: req.userId },
    data: {
      ...(title !== undefined && { title }),
      ...(completed !== undefined && { completed }),
    },
  });
  res.json(todo);
});

// Xóa todo
app.delete("/api/todos/:id", auth, async (req, res) => {
  await prisma.todo.delete({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
