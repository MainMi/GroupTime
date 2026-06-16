import { Outlet } from "react-router-dom";
import Header from '../Header/Header.js';
import ToastContainer from '../../UI/Toast/ToastContainer';
import NavigationTour from '../../components/Onboarding/NavigationTour';

function RootLayout() {
    return (
        <>
            <Header />
            <Outlet />
            <ToastContainer />
            <NavigationTour />
        </>
    )
}

export default RootLayout;