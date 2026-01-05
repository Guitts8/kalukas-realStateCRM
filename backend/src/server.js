require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const imovelRoutes = require("./routes/imovel.routes");
const userRoutes = require("./routes/user.routes");
const imovelFotoRoutes = require("./routes/imovelFoto.routes");


const app = express();

app.use(cors());
app.use(express.json());

// ROTAS
app.use("/api/auth", authRoutes);
app.use("/api/imoveis", imovelRoutes);
app.use("/api/users", userRoutes);
app.use("/api/imoveis/fotos", imovelFotoRoutes);




// UPLOADS (IMPORTANTE)
app.use("/uploads", express.static("uploads"));
const path = require("path");

app.use("/uploads", express.static(path.resolve("uploads")));


app.listen(3333, () => {
  console.log("🚀 API rodando em http://localhost:3333");
});
