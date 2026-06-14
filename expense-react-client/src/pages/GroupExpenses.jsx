import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { useSelector } from "react-redux";
import ExpenseCard from "../components/ExpenseCard";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseSummary from "../components/ExpenseSummary";
import GroupInfo from "../components/GroupInfo";

function GroupExpenses() {
    const { groupId } = useParams();
    const user = useSelector((state) => state.userDetails);

    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [errors, setErrors] = useState({});

    const fetchGroupDetails = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/groups/${groupId}`,
                { withCredentials: true }
            );
            setGroup(response.data);
        } catch (error) {
            console.error("Error fetching group:", error);
            setErrors({ message: "Failed to load group details" });
        }
    };

    const fetchExpenses = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/group/${groupId}`,
                { withCredentials: true }
            );
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/summary/${groupId}`,
                { withCredentials: true }
            );
            setSummary(response.data);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    const refreshData = async () => {
        await Promise.all([
            fetchGroupDetails(),
            fetchExpenses(),
            fetchSummary()
        ]);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await refreshData();
            setLoading(false);
        };
        loadData();
    }, [groupId]);

    const handleExpenseAdded = async () => {
        await refreshData();
    };

    const handleSettleGroup = async () => {
        if (!window.confirm("Are you sure you want to settle this group? This will mark all expenses as settled.")) {
            return;
        }

        try {
            await axios.post(
                `${serverEndpoint}/expenses/settle`,
                { groupId },
                { withCredentials: true }
            );

            await refreshData();
        } catch (error) {
            console.error("Error settling group:", error);
            setErrors({
                message: error.response?.data?.message || "Failed to settle group"
            });
        }
    };

    const isAdmin = group?.adminEmail === user?.email;

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
                <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-3 text-slate-500 font-medium">Loading group expenses...</p>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-5">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    Failed to load group details. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-5">
            <nav aria-label="breadcrumb" className="mb-5">
                <ol className="flex items-center gap-2 text-sm text-slate-500">
                    <li className="inline-flex items-center gap-1">
                        <Link to="/dashboard" className="hover:text-blue-600">Groups</Link>
                    </li>
                    <li className="before:content-['/'] before:mr-2 text-slate-700 font-medium">
                        {group.name}
                    </li>
                </ol>
            </nav>

            <div className="mb-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="font-bold text-slate-900 text-4xl mb-2">
                            {group.name}
                        </h2>
                        <p className="text-slate-500">
                            {group.description || "No description provided"}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-3">
                            {!group.paymentStatus?.isPaid && (
                                <button
                                    onClick={handleSettleGroup}
                                    className="inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-green-700"
                                >
                                    Settle Group
                                </button>
                            )}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddExpense(true)}
                            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-blue-700"
                        >
                            <i className="mr-2 text-lg font-bold">+</i>
                            Add Expense
                        </button>
                    </div>
                </div>

                {group.paymentStatus?.isPaid && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                        <p className="text-green-700 font-medium">
                            ✓ This group has been settled
                        </p>
                    </div>
                )}

                {errors.message && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700">
                        {errors.message}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-5">
                <GroupInfo group={group} />
                <ExpenseSummary summary={summary} />
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-5">
                <h3 className="font-bold text-xl text-slate-900 mb-4">Expenses</h3>
                {expenses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <p>No expenses added yet. Add your first expense to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {expenses.map((expense) => (
                            <ExpenseCard key={expense._id} expense={expense} />
                        ))}
                    </div>
                )}
            </div>

            <AddExpenseModal
                show={showAddExpense}
                onHide={() => setShowAddExpense(false)}
                group={group}
                onSuccess={handleExpenseAdded}
            />
        </div>
    );
}

export default GroupExpenses;
