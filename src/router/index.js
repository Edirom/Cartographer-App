import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import '../public-path.js'


const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import(/* webpackChunkName: "auth" */ '@/views/Auth.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router