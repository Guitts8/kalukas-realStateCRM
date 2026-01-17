const router = require("express").Router();
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/imovel.controller");
const upload = require("../middlewares/uploadImovel");
const fotoController = require("../controllers/imovelFoto.controller");
const { comprometerImovel } = require("../controllers/imovelNegocio.controller");
const { atualizarPlaca } = require("../controllers/imovelPlaca.controller");


router.use(auth);

// imóveis
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.delete("/:id", isAdmin, controller.excluir);

router.put("/:id/placa", atualizarPlaca);


// corretores
router.post("/:id/usuarios", isAdmin, controller.associarUsuario);
router.get("/:id/usuarios", isAdmin, controller.listarUsuarios);
router.delete("/:id/usuarios/:userId", isAdmin, controller.removerUsuario);

// fotos
router.post(
  "/:id/fotos",
  isAdmin,
  upload.array("fotos", 25),
  controller.uploadFotos
);


router.get("/:id/fotos", fotoController.listarFotos);
router.delete("/fotos/:fotoId", isAdmin, fotoController.removerFoto);

//comprometer

router.post("/:id/comprometer", comprometerImovel);



module.exports = router;
