const express = require("express");
const router = express.Router();

const controller = require("../controllers/imovelFoto.controller");

// reordenar (aceita PUT e POST)
router.put("/reordenar", controller.reordenarFotos);
router.post("/reordenar", controller.reordenarFotos);

// listar fotos de um imóvel
router.get("/:id", controller.listarFotos);

// remover foto
router.delete("/:fotoId", controller.removerFoto);

module.exports = router;
