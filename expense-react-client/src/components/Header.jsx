import { Link } from "react-router-dom";
import { useState } from "react";

function Header() {
    const [navOpen, setNavOpen] = useState(false);

    return (
        <nav className="bg-white sticky top-0 border-b shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
                <Link className="flex items-center font-bold text-3xl text-slate-900" to="/">
                    <span className="text-blue-600">Merge</span>Money
                </Link>

                <button
                    className="inline-flex items-center justify-center rounded-md border border-transparent p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                    type="button"
                    aria-controls="navbarSupportedContent"
                    aria-expanded={navOpen}
                    aria-label="Toggle navigation"
                    onClick={() => setNavOpen(!navOpen)}
                >
                    <span className="relative block h-0.5 w-5 bg-current before:absolute before:-top-2 before:block before:h-0.5 before:w-5 before:bg-current after:absolute after:top-2 after:block after:h-0.5 after:w-5 after:bg-current" />
                </button>

                <div
                    className={`${navOpen ? "block" : "hidden"} w-full lg:flex lg:items-center lg:justify-end`}
                    id="navbarSupportedContent"
                >
                    <ul className="flex flex-col lg:flex-row lg:items-center ml-auto mb-2 lg:mb-0 space-y-2 lg:space-y-0 lg:space-x-2">
                        <li>
                            <Link className="px-3 py-2 text-slate-900 font-medium hover:text-blue-600" aria-current="page" to="/">
                                Home
                            </Link>
                        </li>
                        <li className="lg:ml-3 mt-2 lg:mt-0">
                            <Link className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-blue-700" to="/login">
                                Get Started
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Header;