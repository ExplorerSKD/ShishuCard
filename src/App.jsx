import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Services from "./components/services";
import Testimonial from "./components/testimonial";
import Footer from "./components/footer";
import Login from "./components/login";
import AboutUS from "./components/aboutUs";
import Signup from "./components/signup";
import GetStarted from "./components/vaccinationPage";
import ContactUs from "./components/contactUs";
import PrivacyPolicy from "./components/privacy";
import CookiePolicy from "./components/cookies";
import TermsOfUse from "./components/terms";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ParentDashboard from "./components/ParentDashboard";
import { useAuth } from "./context/AuthContext";
import ChildPage from "./components/ChildPage";
import VaccineEducation from "./components/VaccineEducation";
import ImmunizationTracking from "./components/ImmunizationTrackingPage";
import AffordableImmunization from "./components/Affordable";
import MissionIndradhanush from "./components/schemes/MissionIndradhanush";
import UniversalImmunization from "./components/schemes/UniversalImmunization";
import PMJAYScheme from "./components/schemes/PMJAYScheme";
import ChildrenList from "./components/ChildrenList";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import "./theme.css";
import Fts  from "./components/Fts";
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
};

const InnerApp = () => {
  const [theme, setTheme] = useState("light");
  const { user, loading, isAuthenticated } = useAuth();

  // Toggle dark class on body for Tailwind v4 dark mode
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen main-container"> 
          <Navbar />
          <Routes>
            <Route path="/child/:id" element={<ChildPage />} />
            <Route
              path="/"
              element={
                <>
                  <Home />
                  <Services />
                  <Testimonial />
                </>
              }
            />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<AboutUS />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/vaccination" element={<GetStarted />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/vaccine-education" element={<VaccineEducation />} />
            <Route path="/Immunization-Tracking-Page" element={<ImmunizationTracking />} />
            <Route path="/affordable" element={<AffordableImmunization />} />
            <Route path="/schemes/mission-indradhanush" element={<MissionIndradhanush />} />
            <Route path="/schemes/universal-immunization" element={<UniversalImmunization />} />
            <Route path="/schemes/pmjay" element={<PMJAYScheme />} />
            <Route path="/children" element={
              loading ? (
                <div className="flex justify-center items-center min-h-screen">
                  <p className="text-xl">Loading...</p>
                </div>
              ) : (isAuthenticated && user?.role === 'parent') ? <ParentDashboard /> : <Navigate to="/login" replace />
            } />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/features" element={<Fts />} />
            <Route
              path="/login"
              element={loading ? (
                <div className="flex justify-center items-center min-h-screen">
                  <p className="text-xl">Loading...</p>
                </div>
              ) : isAuthenticated ? (
                user?.role === 'admin' ? <Navigate to="/admin-dashboard" replace /> :
                user?.role === 'doctor' ? <Navigate to="/doctor-dashboard" replace /> :
                <Navigate to="/children" replace />
              ) : <Login />}
            />
            <Route path="/doctor-dashboard"
              element={loading ? (
                <div className="flex justify-center items-center min-h-screen">
                  <p className="text-xl">Loading...</p>
                </div>
              ) : (isAuthenticated && user?.role === 'doctor' && user?.isApproved) ? <DoctorDashboard /> : <Navigate to="/login" replace />}
            />
            <Route path="/admin-dashboard"
              element={loading ? (
                <div className="flex justify-center items-center min-h-screen">
                  <p className="text-xl">Loading...</p>
                </div>
              ) : (isAuthenticated && user?.role === 'admin') ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
          </Routes>
          <Footer />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover />
        </div>
      </Router>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
};

export default App;
