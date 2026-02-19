module.exports = [
"[project]/apps/web/mocks/factories/user.factory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "makeOrg",
    ()=>makeOrg,
    "makeOrgMember",
    ()=>makeOrgMember,
    "makeUser",
    ()=>makeUser
]);
let seq = 1;
const id = ()=>`id-${seq++}`;
const now = ()=>new Date().toISOString();
function makeUser(overrides = {}) {
    const n = seq;
    const base = {
        id: id(),
        name: `用户 ${n}`,
        email: `user${n}@example.com`,
        createdAt: now(),
        updatedAt: now()
    };
    return {
        ...base,
        ...overrides
    };
}
function makeOrg(overrides = {}) {
    const n = seq;
    return {
        id: id(),
        slug: `org-${n}`,
        name: `组织 ${n}`,
        plan: 'free',
        createdAt: now(),
        ...overrides
    };
}
function makeOrgMember(overrides = {}) {
    const user = overrides.user ?? makeUser();
    return {
        id: id(),
        userId: user.id,
        orgId: overrides.orgId ?? id(),
        role: 'member',
        user,
        joinedAt: now(),
        ...overrides
    };
}
}),
"[project]/apps/web/mocks/handlers/auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authHandlers",
    ()=>authHandlers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/http.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/HttpResponse.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/delay.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/factories/user.factory.ts [app-ssr] (ecmascript)");
;
;
const MOCK_USER = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeUser"])({
    id: 'user-1',
    name: '张三',
    email: 'demo@nextai.dev'
});
const makeTokens = ()=>({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
    });
const authHandlers = [
    // POST /api/auth/login
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/auth/login', async ({ request })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(400);
        const body = await request.json();
        if (body.password.length < 6) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
                code: 'INVALID_CREDENTIALS',
                message: '邮箱或密码错误'
            }, {
                status: 401
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: {
                user: MOCK_USER,
                tokens: makeTokens()
            }
        });
    }),
    // POST /api/auth/signup
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/auth/signup', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(500);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: {
                user: MOCK_USER,
                tokens: makeTokens()
            }
        }, {
            status: 201
        });
    }),
    // POST /api/auth/refresh
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/auth/refresh', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: makeTokens()
        });
    }),
    // POST /api/auth/logout
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/auth/logout', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(100);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: null
        });
    }),
    // GET /api/auth/me
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/auth/me', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(150);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: MOCK_USER
        });
    })
];
}),
"[project]/apps/web/mocks/factories/workspace.factory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "makeWorkspace",
    ()=>makeWorkspace,
    "makeWorkspaceList",
    ()=>makeWorkspaceList
]);
let seq = 1;
const id = ()=>`ws-${seq++}`;
const now = ()=>new Date().toISOString();
const EMOJIS = [
    '🏠',
    '💻',
    '🔧',
    '🚀',
    '📊',
    '🎯',
    '🌐',
    '⚙️'
];
function makeWorkspace(overrides = {}) {
    const n = seq;
    return {
        id: id(),
        slug: `workspace-${n}`,
        name: `工作区 ${n}`,
        emoji: EMOJIS[n % EMOJIS.length] ?? '📁',
        orgId: 'org-default',
        createdAt: now(),
        ...overrides
    };
}
function makeWorkspaceList(orgId) {
    return [
        makeWorkspace({
            slug: 'default',
            name: '默认工作区',
            emoji: '🏠',
            orgId
        }),
        makeWorkspace({
            slug: 'dev',
            name: '开发团队',
            emoji: '💻',
            orgId
        }),
        makeWorkspace({
            slug: 'ops',
            name: '运维组',
            emoji: '🔧',
            orgId
        })
    ];
}
}),
"[project]/apps/web/mocks/handlers/orgs.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "orgHandlers",
    ()=>orgHandlers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/http.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/HttpResponse.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/delay.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/factories/user.factory.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$workspace$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/factories/workspace.factory.ts [app-ssr] (ecmascript)");
;
;
;
const ORG = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeOrg"])({
    id: 'org-1',
    slug: 'acme',
    name: 'Acme Corp',
    plan: 'pro'
});
const MEMBERS = [
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeOrgMember"])({
        role: 'owner',
        orgId: ORG.id,
        user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeUser"])({
            id: 'user-1',
            name: '张三',
            email: 'demo@nextai.dev'
        })
    }),
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeOrgMember"])({
        role: 'admin',
        orgId: ORG.id,
        user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeUser"])({
            name: '李四'
        })
    }),
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeOrgMember"])({
        role: 'member',
        orgId: ORG.id,
        user: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$user$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeUser"])({
            name: '王五'
        })
    })
];
const WORKSPACES = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$workspace$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeWorkspaceList"])(ORG.id);
const orgHandlers = [
    // GET /api/orgs
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/orgs', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                ORG
            ]
        });
    }),
    // GET /api/orgs/:slug
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/orgs/:slug', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(150);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: ORG
        });
    }),
    // GET /api/orgs/:slug/members
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/orgs/:slug/members', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: MEMBERS,
            total: MEMBERS.length,
            page: 1,
            pageSize: 20,
            totalPages: 1
        });
    }),
    // GET /api/orgs/:slug/workspaces
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/orgs/:slug/workspaces', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: WORKSPACES
        });
    })
];
}),
"[project]/apps/web/mocks/factories/agent.factory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "makeAgent",
    ()=>makeAgent,
    "makeAgentTeam",
    ()=>makeAgentTeam
]);
let seq = 1;
const id = ()=>`agent-${seq++}`;
const now = ()=>new Date().toISOString();
const ROLE_NAMES = {
    coordinator: '协调者',
    requirements: '需求分析师',
    architecture: '架构师',
    frontend: '前端工程师',
    backend: '后端工程师',
    testing: '测试工程师',
    devops: 'DevOps 工程师',
    review: '代码审查员'
};
function makeAgent(overrides = {}) {
    const role = overrides.role ?? 'frontend';
    return {
        id: id(),
        name: ROLE_NAMES[role],
        role,
        status: 'idle',
        workspaceId: 'ws-default',
        model: 'claude-sonnet-4-6',
        tools: [],
        createdAt: now(),
        updatedAt: now(),
        ...overrides
    };
}
function makeAgentTeam(workspaceId) {
    const roles = [
        'coordinator',
        'requirements',
        'architecture',
        'frontend',
        'backend',
        'testing',
        'devops',
        'review'
    ];
    const statuses = [
        'running',
        'idle',
        'idle',
        'running',
        'idle',
        'idle',
        'idle',
        'idle'
    ];
    return roles.map((role, i)=>makeAgent({
            role,
            workspaceId,
            status: statuses[i] ?? 'idle'
        }));
}
}),
"[project]/apps/web/mocks/handlers/agents.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "agentHandlers",
    ()=>agentHandlers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/http.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/HttpResponse.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/delay.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$agent$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/factories/agent.factory.ts [app-ssr] (ecmascript)");
;
;
const AGENTS = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$agent$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAgentTeam"])('ws-default');
const agentHandlers = [
    // GET /api/workspaces/:wsId/agents
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/workspaces/:wsId/agents', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(250);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: AGENTS
        });
    }),
    // GET /api/agents/:id
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/agents/:id', async ({ params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(150);
        const agent = AGENTS.find((a)=>a.id === params['id']);
        if (!agent) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            code: 'NOT_FOUND',
            message: 'Agent 不存在'
        }, {
            status: 404
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: agent
        });
    }),
    // POST /api/workspaces/:wsId/agents
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/workspaces/:wsId/agents', async ({ request, params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(300);
        const body = await request.json();
        const agent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$agent$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAgent"])({
            workspaceId: String(params['wsId']),
            ...body
        });
        AGENTS.push(agent);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: agent
        }, {
            status: 201
        });
    }),
    // PATCH /api/agents/:id
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].patch('/api/agents/:id', async ({ request, params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        const idx = AGENTS.findIndex((a)=>a.id === params['id']);
        if (idx === -1) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            code: 'NOT_FOUND',
            message: 'Agent 不存在'
        }, {
            status: 404
        });
        const body = await request.json();
        const updated = {
            ...AGENTS[idx],
            ...body,
            updatedAt: new Date().toISOString()
        };
        AGENTS[idx] = updated;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: updated
        });
    })
];
}),
"[project]/apps/web/mocks/factories/session.factory.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "makeMessage",
    ()=>makeMessage,
    "makeSeedMessages",
    ()=>makeSeedMessages,
    "makeSession",
    ()=>makeSession
]);
let seq = 1;
const id = (prefix)=>`${prefix}-${seq++}`;
const now = ()=>new Date().toISOString();
function makeSession(overrides = {}) {
    return {
        id: id('session'),
        title: `对话 ${seq}`,
        workspaceId: 'ws-default',
        status: 'active',
        messageCount: 0,
        createdAt: now(),
        ...overrides
    };
}
function makeMessage(overrides) {
    const { sessionId, ...rest } = overrides;
    return {
        id: id('msg'),
        sessionId,
        role: 'user',
        content: '这是一条消息',
        status: 'sent',
        createdAt: now(),
        ...rest
    };
}
function makeSeedMessages(sessionId) {
    return [
        makeMessage({
            sessionId,
            role: 'user',
            content: '请帮我创建一个 Todo 应用'
        }),
        makeMessage({
            sessionId,
            role: 'assistant',
            content: '好的，我来帮你创建一个 Todo 应用。我会先分析需求，然后搭建前后端架构。',
            agentId: 'agent-coordinator'
        }),
        makeMessage({
            sessionId,
            role: 'assistant',
            content: '需求分析完成：\n1. 用户可以添加、编辑、删除任务\n2. 支持任务分类和优先级\n3. 支持截止日期提醒',
            agentId: 'agent-requirements'
        })
    ];
}
}),
"[project]/apps/web/mocks/handlers/sessions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sessionHandlers",
    ()=>sessionHandlers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/http.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/HttpResponse.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/core/delay.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/factories/session.factory.ts [app-ssr] (ecmascript)");
;
;
const SESSIONS = [
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeSession"])({
        id: 'session-1',
        title: 'Todo 应用开发',
        messageCount: 8,
        lastMessageAt: new Date(Date.now() - 3600000).toISOString()
    }),
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeSession"])({
        id: 'session-2',
        title: 'API 设计讨论',
        messageCount: 4,
        lastMessageAt: new Date(Date.now() - 86400000).toISOString()
    }),
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeSession"])({
        id: 'session-3',
        title: '数据库 Schema 设计',
        messageCount: 12,
        lastMessageAt: new Date(Date.now() - 172800000).toISOString()
    })
];
const MESSAGES = {
    'session-1': [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'user',
            content: '请帮我开发一个 Todo 应用，需要支持任务分类和优先级标记。'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-coordinator',
            content: '收到！我来协调团队成员分工完成这个任务。\n\n**分工安排：**\n- 需求分析师：梳理功能需求\n- 架构师：设计技术架构\n- 前后端工程师：并行开发\n- 测试工程师：编写测试用例'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-requirements',
            content: '## 需求分析\n\n### 核心功能\n1. **任务管理**：增删改查、完成标记\n2. **分类系统**：自定义标签/分类\n3. **优先级**：高/中/低三档\n4. **截止日期**：支持提醒\n\n### 用户故事\n- 作为用户，我希望能快速添加任务并设置优先级\n- 作为用户，我希望按分类筛选任务\n- 作为用户，我希望在任务截止前收到提醒'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-architecture',
            content: '## 技术架构设计\n\n### 技术栈\n```\nFrontend: Next.js 15 + TypeScript + TailwindCSS\nBackend:  FastAPI + PostgreSQL\nCache:    Redis\nAuth:     JWT\n```\n\n### 数据模型\n```sql\nCREATE TABLE tasks (\n  id UUID PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  priority ENUM(\'low\', \'medium\', \'high\'),\n  category_id UUID REFERENCES categories(id),\n  due_date TIMESTAMP,\n  completed_at TIMESTAMP,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n```'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-frontend',
            content: '前端已搭建完成，以下是核心组件结构：\n\n```tsx\n// TaskCard.tsx\nexport function TaskCard({ task }: { task: Task }) {\n  return (\n    <div className="rounded-lg border p-4">\n      <div className="flex items-center gap-2">\n        <PriorityBadge priority={task.priority} />\n        <h3 className="font-medium">{task.title}</h3>\n      </div>\n      {task.dueDate && (\n        <DueDateChip date={task.dueDate} />\n      )}\n    </div>\n  )\n}\n```\n\n所有组件已完成，等待后端 API 联调。'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'user',
            content: '后端 API 的设计方案是什么？'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-backend',
            content: '## 后端 API 设计\n\n### RESTful 接口\n\n| 方法 | 路径 | 说明 |\n|------|------|------|\n| GET | /api/tasks | 获取任务列表（支持筛选/排序） |\n| POST | /api/tasks | 创建新任务 |\n| PUT | /api/tasks/:id | 更新任务 |\n| DELETE | /api/tasks/:id | 删除任务 |\n| PATCH | /api/tasks/:id/complete | 标记完成 |\n\n### 查询参数\n```\nGET /api/tasks?category=work&priority=high&page=1&limit=20\n```\n\nAPI 文档已生成，可访问 `/docs` 查看 Swagger UI。'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-1',
            role: 'assistant',
            agentId: 'agent-testing',
            content: '## 测试覆盖报告\n\n✅ 单元测试：**47/47** 通过\n✅ 集成测试：**23/23** 通过\n⚠️ E2E 测试：**18/20** 通过（2 个待修复）\n\n**待修复问题：**\n1. 任务拖拽排序在 Safari 上表现异常\n2. 截止日期提醒通知权限处理逻辑需要优化\n\n测试报告已生成至 `coverage/` 目录。'
        })
    ],
    'session-2': [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-2',
            role: 'user',
            content: '我需要设计一套 RESTful API，用于管理多租户 SaaS 平台。'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-2',
            role: 'assistant',
            agentId: 'agent-architecture',
            content: '## 多租户 API 设计方案\n\n### 方案对比\n\n| 方案 | 优点 | 缺点 |\n|------|------|------|\n| 子域名隔离 | 完全隔离、自定义域名 | 运维复杂 |\n| Path 前缀 | 简单易实现 | 耦合度高 |\n| Header 传递 | 灵活 | 需要客户端配合 |\n\n**推荐方案：** 结合 Path 前缀 + JWT 中租户信息\n\n```\n/api/v1/{tenantId}/resources\n```'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-2',
            role: 'user',
            content: '认证和授权怎么处理？'
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId: 'session-2',
            role: 'assistant',
            agentId: 'agent-backend',
            content: '### 认证授权方案\n\n```python\n# JWT Payload 结构\n{\n  "sub": "user_id",\n  "tenant_id": "tenant_123",\n  "roles": ["admin", "viewer"],\n  "exp": 1735000000\n}\n```\n\n**权限中间件：**\n```python\nasync def verify_tenant_access(request: Request, tenant_id: str):\n    token = extract_token(request)\n    payload = decode_jwt(token)\n    if payload["tenant_id"] != tenant_id:\n        raise HTTPException(403, "Access denied")\n```'
        })
    ]
};
const sessionHandlers = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/workspaces/:wsId/sessions', async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(250);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: SESSIONS
        });
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/workspaces/:wsId/sessions', async ({ request, params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(300);
        const body = await request.json();
        const session = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeSession"])({
            workspaceId: String(params['wsId']),
            ...body
        });
        SESSIONS.unshift(session);
        MESSAGES[session.id] = [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: session
        }, {
            status: 201
        });
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].get('/api/sessions/:id/messages', async ({ params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(200);
        const msgs = MESSAGES[String(params['id'])] ?? [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: msgs
        });
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/sessions/:id/messages', async ({ request, params })=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$delay$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["delay"])(120);
        const body = await request.json();
        const sessionId = String(params['id']);
        const msg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
            sessionId,
            ...body
        });
        if (!MESSAGES[sessionId]) MESSAGES[sessionId] = [];
        MESSAGES[sessionId].push(msg);
        // Update session metadata
        const idx = SESSIONS.findIndex((s)=>s.id === sessionId);
        if (idx !== -1) {
            SESSIONS[idx] = {
                ...SESSIONS[idx],
                messageCount: MESSAGES[sessionId]?.length ?? 0,
                lastMessageAt: new Date().toISOString()
            };
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: msg
        }, {
            status: 201
        });
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["http"].post('/api/sessions/:id/stream', async ({ request, params })=>{
        const body = await request.json();
        const sessionId = String(params['id']);
        const userContent = body.content ?? '';
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start (controller) {
                function send(event) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                }
                async function sleep(ms) {
                    await new Promise((r)=>setTimeout(r, ms));
                }
                async function streamText(messageId, text, chunkSize = 4) {
                    for(let i = 0; i < text.length; i += chunkSize){
                        send({
                            type: 'text-delta',
                            messageId,
                            delta: text.slice(i, i + chunkSize)
                        });
                        await sleep(25);
                    }
                }
                // ── Coordinator response ─────────────────────────────────────────────
                await sleep(400);
                send({
                    type: 'agent-switch',
                    agentId: 'agent-coordinator',
                    agentRole: 'coordinator',
                    agentName: '协调者'
                });
                const coordMsgId = `stream-coord-${Date.now()}`;
                send({
                    type: 'message-start',
                    messageId: coordMsgId,
                    agentId: 'agent-coordinator'
                });
                await streamText(coordMsgId, `收到你的请求："${userContent}"\n\n我来协调团队分工处理这个任务。\n\n**分工安排：**\n- 前端工程师：UI 实现\n- 后端工程师：API 设计\n- 测试工程师：用例编写`);
                send({
                    type: 'message-end',
                    messageId: coordMsgId
                });
                // ── Frontend agent + tool call ───────────────────────────────────────
                await sleep(600);
                send({
                    type: 'agent-switch',
                    agentId: 'agent-frontend',
                    agentRole: 'frontend',
                    agentName: '前端工程师'
                });
                const frontMsgId = `stream-front-${Date.now()}`;
                send({
                    type: 'message-start',
                    messageId: frontMsgId,
                    agentId: 'agent-frontend'
                });
                await streamText(frontMsgId, '我先读取现有代码，了解项目结构。\n\n');
                // Tool call: file read
                const fileToolCall = {
                    id: `tool-read-${Date.now()}`,
                    name: 'file_read',
                    category: 'file',
                    riskLevel: 'low',
                    isLocal: true,
                    params: {
                        path: 'src/components/TaskCard.tsx'
                    },
                    status: 'running'
                };
                send({
                    type: 'tool-call',
                    messageId: frontMsgId,
                    toolCall: fileToolCall
                });
                await sleep(800);
                send({
                    type: 'tool-result',
                    messageId: frontMsgId,
                    toolCallId: fileToolCall.id,
                    result: '// TaskCard.tsx — 87 lines\nexport function TaskCard({ task }: Props) { ... }',
                    status: 'success'
                });
                await sleep(300);
                await streamText(frontMsgId, '\n代码读取完成。`TaskCard` 组件结构清晰，我将在此基础上新增优先级筛选功能。');
                // Tool call: terminal (medium risk)
                const termToolCall = {
                    id: `tool-term-${Date.now()}`,
                    name: 'bash_execute',
                    category: 'terminal',
                    riskLevel: 'medium',
                    isLocal: true,
                    params: {
                        command: 'npm run build',
                        timeout: 30000
                    },
                    status: 'running'
                };
                send({
                    type: 'tool-call',
                    messageId: frontMsgId,
                    toolCall: termToolCall
                });
                await sleep(1200);
                send({
                    type: 'tool-result',
                    messageId: frontMsgId,
                    toolCallId: termToolCall.id,
                    result: '✓ Build succeeded in 4.2s',
                    status: 'success'
                });
                await sleep(200);
                await streamText(frontMsgId, '\n构建通过，准备提交代码。');
                send({
                    type: 'message-end',
                    messageId: frontMsgId
                });
                // ── Approval request (high-risk git push) ───────────────────────────
                await sleep(400);
                const approvMsgId = `stream-approve-${Date.now()}`;
                send({
                    type: 'message-start',
                    messageId: approvMsgId,
                    agentId: 'agent-frontend'
                });
                const approval = {
                    id: `approval-${Date.now()}`,
                    toolName: 'git_push',
                    reason: '即将推送代码到远程仓库 origin/main 分支，影响线上环境',
                    riskLevel: 'high',
                    policySource: '项目策略：高风险操作需审批',
                    params: {
                        remote: 'origin',
                        branch: 'main',
                        force: false
                    },
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    status: 'pending'
                };
                send({
                    type: 'approval-request',
                    messageId: approvMsgId,
                    approval
                });
                send({
                    type: 'message-end',
                    messageId: approvMsgId
                });
                await sleep(200);
                send({
                    type: 'done'
                });
                controller.close();
                // Persist user message + agent messages in mock store
                if (!MESSAGES[sessionId]) MESSAGES[sessionId] = [];
                const userMsg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$factories$2f$session$2e$factory$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeMessage"])({
                    sessionId,
                    role: 'user',
                    content: userContent
                });
                MESSAGES[sessionId].push(userMsg);
                const idx = SESSIONS.findIndex((s)=>s.id === sessionId);
                if (idx !== -1) {
                    SESSIONS[idx] = {
                        ...SESSIONS[idx],
                        messageCount: MESSAGES[sessionId].length,
                        lastMessageAt: new Date().toISOString()
                    };
                }
            }
        });
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HttpResponse"](stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    })
];
}),
"[project]/apps/web/mocks/handlers/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "handlers",
    ()=>handlers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/handlers/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$orgs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/handlers/orgs.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$agents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/handlers/agents.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$sessions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/handlers/sessions.ts [app-ssr] (ecmascript)");
;
;
;
;
const handlers = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authHandlers"],
    ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$orgs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["orgHandlers"],
    ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$agents$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["agentHandlers"],
    ...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$sessions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sessionHandlers"]
];
}),
"[project]/apps/web/mocks/browser.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "worker",
    ()=>worker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/msw@2.12.10_@types+node@22.19.11_typescript@5.9.3/node_modules/msw/lib/browser/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/mocks/handlers/index.ts [app-ssr] (ecmascript)");
;
;
const worker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$msw$40$2$2e$12$2e$10_$40$types$2b$node$40$22$2e$19$2e$11_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setupWorker"])(...__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$mocks$2f$handlers$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["handlers"]);
}),
];

//# sourceMappingURL=apps_web_mocks_548cd688._.js.map