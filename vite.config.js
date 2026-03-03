import { defineConfig } from 'vite';
import { resolve } from 'node:path';

function notFoundFallbackPlugin() {
  const knownRoutes = new Set([
    '/',
    '/profile/',
    '/login/',
    '/register/',
    '/admin/',
    '/admin/appointments/',
    '/admin/appointments/view/',
    '/admin/appointments/edit/',
    '/admin/users/',
    '/admin/users/view/',
    '/admin/users/edit/',
    '/appointment/',
    '/appointments/',
    '/appointments/create/',
    '/appointments/edit/',
    '/404.html'
  ]);

  return {
    name: 'not-found-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url || '/';
        const pathname = url.split('?')[0] || '/';

        const isAssetRequest = pathname.includes('.') || pathname.startsWith('/@');
        if (isAssetRequest || knownRoutes.has(pathname)) {
          next();
          return;
        }

        req.url = '/404.html';
        next();
      });
    }
  };
}

export default defineConfig({
  root: 'src',
  envDir: '..',
  plugins: [notFoundFallbackPlugin()],
  appType: 'mpa',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        profile: resolve(__dirname, 'src/profile/index.html'),
        login: resolve(__dirname, 'src/login/index.html'),
        register: resolve(__dirname, 'src/register/index.html'),
        adminDashboard: resolve(__dirname, 'src/admin/index.html'),
        adminAppointments: resolve(__dirname, 'src/admin/appointments/index.html'),
        adminAppointmentsView: resolve(__dirname, 'src/admin/appointments/view/index.html'),
        adminAppointmentsEdit: resolve(__dirname, 'src/admin/appointments/edit/index.html'),
        adminUsers: resolve(__dirname, 'src/admin/users/index.html'),
        adminUsersView: resolve(__dirname, 'src/admin/users/view/index.html'),
        adminUsersEdit: resolve(__dirname, 'src/admin/users/edit/index.html'),
        appointment: resolve(__dirname, 'src/appointment/index.html'),
        appointments: resolve(__dirname, 'src/appointments/index.html'),
        appointmentsCreate: resolve(__dirname, 'src/appointments/create/index.html'),
        appointmentsEdit: resolve(__dirname, 'src/appointments/edit/index.html'),
        '404': resolve(__dirname, 'src/404.html')
      }
    }
  }
});
