import { createRouter, createWebHistory } from 'vue-router'
import RoutePlaceholder from '../views/RoutePlaceholder.vue'

const route = (path, title, description, requiresAuth = false) => ({
  path,
  component: RoutePlaceholder,
  props: { title, description },
  meta: { requiresAuth },
})

export default createRouter({
  history: createWebHistory(),
  routes: [
    route('/', 'Dashboard', 'Your authenticated dashboard will be available here.', true),
    route('/profile', 'Profile', 'Your profile will be available here.', true),
    route('/books', 'Books', 'Book management will be available in the next dashboard feature.', true),
    route('/audit-logs', 'Audit logs', 'Audit history will be available in a later dashboard feature.', true),
    route('/users', 'Users', 'User management is deferred until handoff.', true),
    route('/login', 'Login', 'Sign-in will be available in the next authentication story.'),
    route('/register', 'Register', 'Registration will be available in the next authentication story.'),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
