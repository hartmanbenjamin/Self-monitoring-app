import { Router } from "../deps.js";
import { hello, showLogin, handleLogin, showRegister, handleRegister, main, showMorning, reportMorning, showSummary, showEvening, reportEvening, refreshSummary, logOut} from "./controllers/controller.js";
import * as api from "./apis/api.js";

const router = new Router();

// Controller
router.get('/', hello);
router.get('/auth/login', showLogin);
router.post('/auth/login', handleLogin);
router.get('/auth/register', showRegister);
router.post('/auth/register', handleRegister);
router.get('/behavior/reporting', main);
router.get('/behavior/morning', showMorning);
router.post('/behavior/morning', reportMorning);
router.get('/behavior/summary', showSummary);
router.get('/behavior/evening', showEvening);
router.post('/behavior/evening', reportEvening);
router.post('/behavior/summary', refreshSummary);
router.post('/auth/logout', logOut);



// APIs
router.get('/api/hello', api.getHello);
router.post('/api/hello', api.setHello);
router.get('/api/summary', api.simpleSummary);
router.get('/api/summary/:year/:month/:day', api.specificSummary);

export { router };