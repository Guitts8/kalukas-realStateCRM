const router = require("express").Router();
const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");
const controller = require("../controllers/user.controller");

router.use(auth);
router.use(isAdmin);

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.remover);

module.exports = router;
