import { Application, viewEngine, engineFactory, adapterFactory, Session } from "./deps.js";
import { router } from "./routes/routes.js"
import * as middleware from "./middlewares/middlewares.js";

// Create a new application
const app = new Application();

// Create a new session
const session = new Session({ framework: "oak" });
await session.init();   

// Create a view engine and set viewRoot as directory 'views'
const ejsEngine = engineFactory.getEjsEngine();
const oakAdapter = adapterFactory.getOakAdapter();
app.use(viewEngine(oakAdapter, ejsEngine, {
    viewRoot: "./views"
}));


app.use(session.use()(session));

app.use(middleware.errorMiddleware);
app.use(middleware.requestTimingMiddleware);
app.use(middleware.serveStaticFilesMiddleware);
app.use(middleware.authMiddleware);

app.use(router.routes());

app.listen({ port: 7777 });

