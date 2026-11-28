import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdForum,
  MdBook,
  MdExtension,
  MdAutoStories,
  MdLibraryBooks,
  MdLogout,
} from "react-icons/md";

const SIDEBAR_MENUS = [
  { label: "Dasbor", path: "/dashboard-batak", icon: MdDashboard },
  { label: "Forum Diskusi", path: "/forum-diskusi", icon: MdForum },
  { label: "Materi", path: "/pilih-materi", icon: MdBook },
  { label: "Permainan", path: "/permainan", icon: MdExtension },
  { label: "Literasi Budaya", path: "/literasi-budaya", icon: MdAutoStories },
  { label: "Kosakata", path: "/latihan-kosakata", icon: MdLibraryBooks },
];

export default function Sidebar({ isOpen, onClose, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    onClose();
    if (onLogout) {
      await onLogout();
    } else {
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bg-white w-64 h-full shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between w-full px-8 py-8 md:py-10">
          <button
            type="button"
            onClick={onClose}
            className="logo font-irish m-0 text-2xl cursor-pointer hover:opacity-80 transition focus:outline-none"
          >
            dialek.id
          </button>
        </div>

        <ul className="mt-2 space-y-1">
          {SIDEBAR_MENUS.map((menu) => {
            const IconComponent = menu.icon;
            const isActive = location.pathname === menu.path;

            return (
              <li key={menu.path}>
                <Link
                  to={menu.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-6 py-3 transition ${
                    isActive
                      ? "bg-green-50 text-custom1 font-semibold"
                      : "text-black font-medium hover:bg-gray-100"
                  }`}
                >
                  <IconComponent className="text-custom1 text-2xl shrink-0" />
                  <span>{menu.label}</span>
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-gray-100 transition text-left cursor-pointer"
            >
              <MdLogout className="text-custom1 text-2xl shrink-0" />
              <span className="text-black font-medium">Keluar</span>
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
}