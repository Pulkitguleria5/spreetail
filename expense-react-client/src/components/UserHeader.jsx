import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";

function UserHeader() {
    const user = useSelector((state) => state.userDetails);
    const location = useLocation();
    const [navOpen, setNavOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Helper to set active class
    const isActive = (path) =>
        location.pathname === path
            ? "font-bold text-blue-600"
            : "text-slate-500";

    return (
        <nav className="bg-white sticky top-0 border-b shadow-sm py-2">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                {/* Brand Logo */}
                <Link
                    className="flex items-center font-bold text-2xl"
                    to="/dashboard"
                >
                    <span className="text-blue-600">Merge</span>Money
                </Link>

                <button
                    className="inline-flex items-center justify-center rounded-md border border-transparent p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                    type="button"
                    aria-controls="userNavbar"
                    aria-expanded={navOpen}
                    onClick={() => setNavOpen(!navOpen)}
                >
                    <span className="relative block h-0.5 w-6 bg-current before:absolute before:-top-2 before:block before:h-0.5 before:w-6 before:bg-current after:absolute after:top-2 after:block after:h-0.5 after:w-6 after:bg-current" />
                </button>

                <div
                    className={`${navOpen ? "block" : "hidden"} w-full lg:flex lg:items-center lg:justify-between`}
                    id="userNavbar"
                >
                    {/* Primary App Navigation */}
                    <ul className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 mr-auto mb-2 lg:mb-0 lg:ml-4 gap-2">
                        <li className="nav-item">
                            <Link
                                className={`nav-link px-3 ${isActive(
                                    "/dashboard"
                                )}`}
                                to="/dashboard"
                            >
                                Groups
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className={`nav-link px-3 ${isActive(
                                    "/import"
                                )}`}
                                to="/import"
                            >
                                Import CSV
                            </Link>
                        </li>
                    </ul>
                    
                    {/* User Profile Dropdown */}
                    <ul className="flex items-center space-x-3 ml-auto">
                        <li className="relative dropdown">
                            <Link
                                className="flex items-center rounded-full bg-slate-100 px-3 py-1 border border-slate-200 text-slate-700"
                                to="#"
                                role="button"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <div
                                    className="rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 shadow-sm"
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        fontSize: "12px",
                                    }}
                                >
                                    {user?.name
                                        ? user.name.charAt(0).toUpperCase()
                                        : "U"} 
                                </div>
                                <span className="text-slate-900 font-medium text-sm">
                                    {user ? user.name : "Account"}
                                </span>
                            </Link>
                            <ul
                                className={`${menuOpen ? "block" : "hidden"} absolute right-0 mt-2 rounded-xl bg-white shadow-lg border border-slate-100`}
                            >
                                <li
                                    className="px-3 py-2 border-b border-slate-100 mb-1"
                                    style={{ minWidth: "200px" }}
                                >
                                    <p className="mb-0 text-sm font-bold text-slate-900">
                                        Signed in as
                                    </p>
                                    <p className="mb-0 text-sm text-slate-500">
                                       <Link to="/D">
                                            {user?.email}
                                        </Link>
                                    </p>
                                </li>


                                <li>
                                    <Link
                                        className="block px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
                                        to="/manage-users"
                                    >
                                        <i className="mr-2">👥</i>{" "}
                                        Manage Users
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        className="block px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
                                        to="/import"
                                    >
                                        <i className="mr-2">📥</i>{" "}
                                        Import Expenses
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/manage-payments"
                                        className="block px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
                                    >
                                        <span className="mr-2 text-green-600">
                                            ✔
                                        </span>
                                        <span className="text-sm">
                                        manage payments
                                        </span>

                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/manage-subscription"
                                        className="block px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
                                    >
                                        <span className="mr-2 text-green-600">
                                            ✔
                                        </span>

                                        <span className="text-sm">
                                        manage subscription
                                        </span>
                                    </Link>
                                </li>



                                <hr className="my-1 border-t border-slate-100" />


                                <li>
                                    <Link
                                        className="block px-4 py-2 text-red-600 font-medium hover:bg-red-50"
                                        to="/logout"
                                    >
                                        <i className="mr-2">↩</i>{" "}
                                        Sign Out
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default UserHeader;
