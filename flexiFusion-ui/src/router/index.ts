import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

function removeQueryParams(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  console.log(to);

  if (Object.keys(to.query).length)
    next({ path: to.path, query: {}, hash: to.hash });
  else next();
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Swap.vue"),
  },
  {
    path: "/pools",
    name: "Pools",
    component: () => import("@/views/pool/Pools.vue"),
  },
  {
    path: "/pools/farms",
    name: "PoolFarms",
    component: () => import("@/views/pool/PoolFarms.vue"),
  },
  {
    path: "/pools/:chainId/:poolId",
    name: "Pool",
    component: () => import("@/views/pool/Pool.vue"),
  },
  {
    path: "/pools/:chainId/:poolId/farms/:farmId",
    name: "PoolFarm",
    component: () => import("@/views/pool/PoolFarm.vue"),
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
