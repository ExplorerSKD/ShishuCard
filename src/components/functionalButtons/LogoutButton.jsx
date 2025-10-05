import { useAuth } from '../../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  return (
    <div>
      <button
        onClick={handleLogout}
        className="mt-4 md:mt-0 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutButton;
