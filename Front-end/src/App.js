import './App.scss';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/Root/RootLayout';
import AboutPage from './pages/About/AboutPage';
import SignPage from './pages/Sign/SignPage';
import ProfilePage from './pages/Profile/ProfilePage';
import GroupSearch from './pages/Group/GroupSearch/GroupSearch';
import GroupInfo from './pages/Group/GroupInfo/GroupInfo';
import GroupCreate from './pages/Group/GroupCreate/GroupCreate';
import SchedulePage from './pages/Schedule/SchedulePage';
import ActionTokenPage from './pages/ActionToken/ActionTokenPage';

function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <RootLayout />,
            children: [
                { index: true, element: <AboutPage /> },
                { path: 'sign', element: <SignPage /> },
                { path: 'profile', element: <ProfilePage /> },
                { path: 'groups', element: <GroupSearch /> },
                { path: 'groups/info/:groupId', element: <GroupInfo /> },
                { path: 'groups/edit', element: <GroupCreate /> },
                { path: 'schedule', element: <SchedulePage /> },
            ]
        },
        { path: '/confirm/email', element: <ActionTokenPage action="confirmEmail" /> },
        { path: '/group/confirm/invite', element: <ActionTokenPage action="confirmGroup" /> },
        { path: '/group/delete/invite', element: <ActionTokenPage action="declineGroup" /> },
        { path: '/group/confirm/admin', element: <ActionTokenPage action="confirmAdmin" /> },
        { path: '/group/delete/admin', element: <ActionTokenPage action="declineAdmin" /> },
        { path: '/group/confirm/user', element: <ActionTokenPage action="confirmUser" /> },
        { path: '/group/delete/user', element: <ActionTokenPage action="declineUser" /> },
        { path: '/password/forgot', element: <ActionTokenPage action="resetPassword" /> },
    ]);

    return (
        <RouterProvider router={router} />
    );
}

export default App;
