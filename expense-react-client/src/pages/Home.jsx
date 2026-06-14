import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="bg-white">
            <header className="py-5 mb-5 bg-slate-50 border-b">
                <div className="max-w-6xl mx-auto px-4 py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
                        <div className="text-center lg:text-left">
                            <span className="inline-flex items-center rounded-full bg-blue-600/10 text-blue-600 px-3 py-2 mb-3 font-bold">
                                All-in-One Finance Manager
                            </span>
                            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight">
                                Stop tracking twice. <br />
                                <span className="text-blue-600">
                                    Start Merging.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-500 mb-5">
                                The first app that bridges the gap between
                                splitting bills with friends and tracking your
                                personal wealth. One transaction, zero
                                double-entry.
                            </p>
                            <div className="flex justify-center lg:justify-start gap-3">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-lg font-bold text-white shadow hover:bg-blue-700"
                                >
                                    Get Started
                                </Link>
                                <a
                                    href="#"
                                    className="inline-flex items-center justify-center rounded-full border border-slate-300 text-slate-700 px-5 py-3 text-lg hover:bg-slate-100"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
                                <div className="bg-slate-900 p-3 flex gap-2">
                                    <div
                                        className="rounded-full bg-red-500"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                    <div
                                        className="rounded-full bg-yellow-400"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                    <div
                                        className="rounded-full bg-green-500"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                </div>
                                <div className="p-4 bg-white text-center">
                                    <h6 className="text-slate-500 uppercase text-sm">
                                        Net Worth This Month
                                    </h6>
                                    <h2 className="font-bold text-3xl">₹75,400.00</h2>
                                    <div className="mt-3 p-3 bg-slate-100 rounded-xl text-left border-l-4 border-blue-600">
                                        <div className="flex justify-between font-bold">
                                            <span>Goa Trip Split</span>
                                            <span className="text-red-600">
                                                -₹2,500
                                            </span>
                                        </div>
                                        <small className="text-slate-500">
                                            Auto-synced to Personal Spending
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <section id="features" className="max-w-6xl mx-auto px-4 py-5">
                <div className="text-center mb-5">
                    <h2 className="font-bold text-3xl md:text-4xl">Why MergeMoney is Different</h2>
                    <p
                        className="text-slate-500 mx-auto"
                        style={{ maxWidth: "600px" }}
                    >
                        We believe your share of a group expense IS a personal
                        expense. We handle the math so you don't have to.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div className="h-full rounded-2xl bg-white shadow-sm p-4 transition hover:shadow-md">
                            <div
                                className="bg-blue-600/10 text-blue-600 p-3 rounded-xl inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="text-3xl">👥</i>
                            </div>
                            <h4 className="font-bold text-xl">Smart Bill Splitting</h4>
                            <p className="text-slate-500">
                                Create groups for trips, rent, or dinners.
                                Invite friends and split costs with one click.
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="h-full rounded-2xl bg-white shadow-sm p-4">
                            <div
                                className="bg-green-500/10 text-green-500 p-3 rounded-xl inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="text-3xl">✅</i>
                            </div>
                            <h4 className="font-bold text-xl">Personal Spending</h4>
                            <p className="text-slate-500">
                                Your share of group expenses automatically flows
                                into your personal ledger. No more manual entry.
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="h-full rounded-2xl bg-white shadow-sm p-4">
                            <div
                                className="bg-sky-500/10 text-sky-500 p-3 rounded-xl inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="text-3xl">📈</i>
                            </div>
                            <h4 className="font-bold text-xl">Wealth & Investments</h4>
                            <p className="text-slate-500">
                                Track Mutual Funds, Stocks, and Crypto alongside
                                your daily coffee spend. See the big picture.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 text-white py-5 mt-5">
                <div className="max-w-6xl mx-auto px-4 py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">
                                Master Your Wealth.
                            </h2>
                            <p className="text-xl opacity-75 mb-4">
                                Categorize your life three levels deep (Grocery{" "}
                                {">"} Food {">"} Essentials). Track your income
                                sources and watch your "Excess Money" grow month
                                over month.
                            </p>
                            <ul className="list-none">
                                <li className="mb-2">
                                    <i className="text-blue-400 mr-2">✓</i>{" "}
                                    Real-time Dashboard Statistics
                                </li>
                                <li className="mb-2">
                                    <i className="text-blue-400 mr-2">✓</i>{" "}
                                    Custom Date Range Reporting
                                </li>
                                <li className="mb-2">
                                    <i className="text-blue-400 mr-2">✓</i>{" "}
                                    Secure Replica-Set Transactions
                                </li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10">
                                <h1 className="text-7xl font-bold">100%</h1>
                                <p className="uppercase font-bold tracking-widest">
                                    Unified Data
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 py-5 my-5 text-center">
                <div className="py-5 bg-blue-600 rounded-[2rem] text-white shadow-lg">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3">
                        Ready to simplify your finances?
                    </h2>
                    <p className="text-lg mb-4 opacity-75">
                        Join thousands of users managing their wealth smarter
                        with MergeMoney.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-lg font-bold text-blue-600 shadow hover:bg-slate-100"
                    >
                        Create Your Account
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Home;
