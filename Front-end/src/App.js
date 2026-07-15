import './App.scss';
import { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/Root/RootLayout';
import Loader from './UI/Loader/Loader';

// Route-level code-splitting: each page ships as its own chunk, loaded on demand.
// RootLayout stays static so the app shell (Header, toasts) renders immediately.
const AboutPage = lazy(() => import('./pages/About/AboutPage'));
const SignPage = lazy(() => import('./pages/Sign/SignPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const GroupSearch = lazy(() => import('./pages/Group/GroupSearch/GroupSearch'));
const GroupInfo = lazy(() => import('./pages/Group/GroupInfo/GroupInfo'));
const GroupCreate = lazy(() => import('./pages/Group/GroupCreate/GroupCreate'));
const SchedulePage = lazy(() => import('./pages/Schedule/SchedulePage'));
const PublicSchedulePage = lazy(() => import('./pages/Schedule/PublicSchedulePage'));
const ActionTokenPage = lazy(() => import('./pages/ActionToken/ActionTokenPage'));

const withSuspense = (element) => <Suspense fallback={<Loader />}>{element}</Suspense>;

function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <RootLayout />,
            children: [
                { index: true, element: withSuspense(<AboutPage />) },
                { path: 'sign', element: withSuspense(<SignPage />) },
                { path: 'profile', element: withSuspense(<ProfilePage />) },
                { path: 'groups', element: withSuspense(<GroupSearch />) },
                { path: 'groups/info/:groupId', element: withSuspense(<GroupInfo />) },
                { path: 'groups/edit', element: withSuspense(<GroupCreate />) },
                { path: 'schedule', element: withSuspense(<SchedulePage />) },
            ]
        },
        { path: '/confirm/email', element: withSuspense(<ActionTokenPage action="confirmEmail" />) },
        { path: '/group/confirm/invite', element: withSuspense(<ActionTokenPage action="confirmGroup" />) },
        { path: '/group/delete/invite', element: withSuspense(<ActionTokenPage action="declineGroup" />) },
        { path: '/group/confirm/admin', element: withSuspense(<ActionTokenPage action="confirmAdmin" />) },
        { path: '/group/delete/admin', element: withSuspense(<ActionTokenPage action="declineAdmin" />) },
        { path: '/group/confirm/user', element: withSuspense(<ActionTokenPage action="confirmUser" />) },
        { path: '/group/delete/user', element: withSuspense(<ActionTokenPage action="declineUser" />) },
        { path: '/password/forgot', element: withSuspense(<ActionTokenPage action="resetPassword" />) },
        { path: '/schedule/public/:token', element: withSuspense(<PublicSchedulePage />) },
    ]);

    return (
        <RouterProvider router={router} />
    );
}

export default App;
