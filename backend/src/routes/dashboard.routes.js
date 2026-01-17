const router = require("express").Router();

const auth = require("../middlewares/auth");
const isAdmin = require("../middlewares/isAdmin");

const {
  placasResumo,
  vendasResumo,
  alugueisResumo,
} = require("../controllers/dashboard.controller");

router.use(auth);
router.use(isAdmin);

router.get("/placas", placasResumo);
router.get("/vendas", vendasResumo);
router.get("/aluguels", alugueisResumo);

module.exports = router;
