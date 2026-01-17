require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth.routes");
const imovelRoutes = require("./routes/imovel.routes");
const userRoutes = require("./routes/user.routes");
const imovelFotoRoutes = require("./routes/imovelFoto.routes");
const dashboardRoutes = require("./routes/dashboard.routes");


const app = express();

app.use(cors());
app.use(express.json());

// ✅ GARANTE QUE A PASTA uploads EXISTE
const uploadsPath = path.resolve("uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ✅ SERVE ARQUIVOS ESTÁTICOS EM /uploads (SÓ UMA VEZ)
app.use("/uploads", express.static(uploadsPath));

// ROTAS (mantendo seu padrão /api)
app.use("/api/auth", authRoutes);
app.use("/api/imoveis", imovelRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);


// ⚠️ se você já usa isso em outra parte, mantém.
app.use("/api/imoveis/fotos", imovelFotoRoutes);

app.listen(3333, () => {
  console.log("🚀 API rodando em http://localhost:3333");
  console.log("📁 Uploads em:", uploadsPath);
});
