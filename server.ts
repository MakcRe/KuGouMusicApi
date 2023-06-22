import * as fs from 'node:fs';
import * as path from 'node:path';
import express, { Express } from 'express';
import decode from 'safe-decode-uri-component';
import type { Server } from 'http';
import { cookieToJson } from './util/util';
import { createRequest } from './util/request';

/**
 *  描述：动态获取模块定义
 * @param {string}  modulesPath  模块路径(TS)
 * @param {Record<string, string>} specificRoute  特定模块定义
 * @param {boolean} doRequire  如果为 true，则使用 require 加载模块, 否则打印模块路径， 默认为true
 *
 * @example getModuleDefinitions("./module", {"album_new.js": "/album/create"})
 */
const getModulesDefinitions = async (modulesPath: string, specificRoute: Record<string, string>, doRequire: boolean = true): Promise<ModuleDefinition[]> => {
  const files = await fs.promises.readdir(modulesPath);
  const parseRoute = (fileName: string) => specificRoute && fileName in specificRoute ? specificRoute[fileName] : `/${fileName.replace(/\.(ts|js)$/i, '').replace(/_/g, '/')}`;

  return files.reverse()
    .filter((fileName: string) => (fileName.endsWith('.ts') || fileName.endsWith('.js')) && !fileName.startsWith('_'))
    .map((fileName: string) => {
      const identifier = fileName.split('.').shift();
      const route = parseRoute(fileName);
      const modulePath = path.resolve(modulesPath, fileName);
      const module = doRequire ? require(modulePath).default : modulePath;
      return { identifier, route, module };
    });
};

const consturctServer = async (moduleDefs?: ModuleDefinition[]): Promise<Express> => {
  const app = express();
  const { CORS_ALLOW_ORIGIN } = process.env;
  app.set('trust proxy', true);

  // CORS & Preflight request
  app.use((req, res, next) => {
    if (req.path !== '/' && req.path.includes('.')) {
      res.set({
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin':
          CORS_ALLOW_ORIGIN || req.headers.origin || '*',
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
      });
    }
    req.method === 'OPTIONS' ? res.status(204).end() : next();
  });

  // Cookie Parser
  app.use((req, _, next) => {
    req.cookies = {};
    ;(req.headers.cookie || '').split(/;\s+|(?<!\s)\s+$/g).forEach((pair: string) => {
      const crack = pair.indexOf('=');
      if (crack < 1 || crack == pair.length - 1) return;
      req.cookies[decode(pair.slice(0, crack)).trim()] = decode(pair.slice(crack + 1)).trim();
    });
    next();
  });

  // Body Parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  /**
   * Serving static files
   */
  app.use(express.static(path.join(__dirname, 'public')))

  const moduleDefinitions = moduleDefs || (await getModulesDefinitions(path.join(__dirname, 'module'), {}));

  for (const moduleDef of moduleDefinitions) {
    app.use(moduleDef.route, async (req, res) => {
      ;[req.query, req.body].forEach((item) => {
        if (typeof item.cookie === 'string') {
          item.cookie = cookieToJson(decode(item.cookie));
        }
      });

      let query = Object.assign({}, { cookie: req.cookies }, req.query, req.body);


      try {
        const moduleResponse = await moduleDef.module(query, (config) => {
          let ip = req.ip;
          if (ip.substring(0, 7) == '::ffff:') {
            ip = ip.substring(7)
          }
          config.ip = ip;
          return createRequest(config);
        });

        console.log('[OK]', decode(req.originalUrl))

        const cookies = moduleResponse.cookie;
        if (!query.noCookie) {
          if (Array.isArray(cookies) && cookies.length > 0) {
            if (req.protocol === 'https') {
              // Try to fix CORS SameSite Problem
              res.append(
                'Set-Cookie',
                cookies.map((cookie) => {
                  return cookie + '; SameSite=None; Secure'
                }),
              )
            } else {
              res.append('Set-Cookie', cookies)
            }
          }
        }

        res.status(moduleResponse.status).send(moduleResponse.body)
      } catch (e) {
        const moduleResponse = e as any;
        console.log('[ERR]', decode(req.originalUrl), {
          status: moduleResponse.status,
          body: moduleResponse.body,
        })

        if (!moduleResponse.body) {
          res.status(404).send({
            code: 404,
            data: null,
            msg: 'Not Found',
          })
          return
        }

        res.status(moduleResponse.status).send(moduleResponse.body)

      }
    });
  }


  return app;
};

type UseExpress = Express & { service: Server };

export const startService = async () => {
  const port = Number(process.env.PORT || '3001');
  const host = process.env.HOST || '';

  const app: Express = await consturctServer();

  const appExt: UseExpress = app as UseExpress;

  appExt.service = app.listen(port, host, () => {
    console.log(`server running @ http://${host ? host : 'localhost'}:${port}`);
  });

  return appExt;
};