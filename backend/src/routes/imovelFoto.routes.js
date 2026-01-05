const router = require("express").Router();
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/imovelFoto.controller");

router.use(auth);
router.use(isAdmin);

// listar fotos do imóvel
router.get("/:id", controller.listarFotos);

// reordenar fotos
router.put("/reordenar", isAdmin, controller.reordenarFotos);

// remover foto
router.delete("/:fotoId", controller.removerFoto);

module.exports = router;
