import { send } from '../deps.js';

const errorMiddleware = async(context, next) => {
  try {
    await next();
  } catch (e) {
    console.log(e);
  }
}

const requestTimingMiddleware = async({ request, session }, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const authed = await session.get('authorized');
  let id = 'anonymous';
  if (authed) {
    id = await session.get('id');
  }
  console.log(`${request.method} - ${request.url.pathname} - ${new Date()} - ${ms} ms - uid ${id}`);
}

const serveStaticFilesMiddleware = async(context, next) => {
  if (context.request.url.pathname.startsWith('/static')) {
    const path = context.request.url.pathname.substring(7);
  
    await send(context, path, {
      root: `${Deno.cwd()}/static`
    });
  
  } else {
    await next();
  }
}

const authMiddleware = async({request, response, session}, next) => {
  if (!request.url.pathname.includes('/api/summary') && request.url.pathname !== '/' && request.url.pathname !== '/auth/register' && request.url.pathname !== '/auth/login' && !(await session.get('authorized'))) {
    response.redirect('/auth/login');
  } else {
    await next();
  }
};



export { errorMiddleware, requestTimingMiddleware, serveStaticFilesMiddleware, authMiddleware };