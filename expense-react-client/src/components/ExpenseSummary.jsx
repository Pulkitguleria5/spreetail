import { useState } from "react";

function ExpenseSummary({ summary }) {
    const [expandedUser, setExpandedUser] = useState(null);

    if (!summary) {
        return (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl text-slate-900 mb-4">Expense Summary</h3>
                <p className="text-slate-500">No expenses yet</p>
            </div>
        );
    }

    const toggleBreakdown = (email) => {
        if (expandedUser === email) {
            setExpandedUser(null);
        } else {
            setExpandedUser(email);
        }
    };

    const simplifiedDebts = summary.simplifiedDebts || [];
    const breakdowns = summary.breakdowns || {};

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
                <h3 className="font-bold text-xl text-slate-900 mb-4 flex items-center justify-between">
                    <span>Individual Balances</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded">
                        Base: INR
                    </span>
                </h3>
                
                <div className="space-y-3">
                    {summary.summary.map((item, index) => {
                        const email = item.userEmail;
                        const isExpanded = expandedUser === email;
                        const userBreakdown = breakdowns[email] || [];
                        const displayName = email.split("@")[0];

                        return (
                            <div key={index} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div 
                                    className="flex items-center justify-between p-3.5 transition-colors cursor-pointer"
                                    style={{ 
                                        backgroundColor: item.netBalance === 0 
                                            ? "#f0fdf4" 
                                            : item.netBalance > 0 
                                                ? "#f0f7ff" 
                                                : "#fff5f5" 
                                    }}
                                    onClick={() => toggleBreakdown(email)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-900 font-semibold capitalize">
                                            {displayName}
                                        </span>
                                        <button 
                                            type="button"
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            {isExpanded ? "Hide Breakdown" : "View Breakdown"}
                                        </button>
                                    </div>
                                    <span 
                                        className={`font-bold text-base ${
                                            item.netBalance === 0 
                                                ? "text-green-600" 
                                                : item.netBalance > 0 
                                                    ? "text-blue-600" 
                                                    : "text-red-600"
                                        }`}
                                    >
                                        {item.netBalance === 0 
                                            ? "Settled" 
                                            : item.netBalance > 0 
                                                ? `+₹${item.netBalance.toFixed(2)}` 
                                                : `-₹${Math.abs(item.netBalance).toFixed(2)}`
                                        }
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className="bg-slate-50 border-t border-slate-100 p-3.5 space-y-2 max-h-60 overflow-y-auto">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Itemized Breakdown:
                                        </p>
                                        {userBreakdown.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic">No transactions affecting this balance.</p>
                                        ) : (
                                            userBreakdown.map((exp, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{exp.description}</p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {new Date(exp.date).toLocaleDateString()} • Paid by {exp.paidBy.split("@")[0]}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold ${exp.netEffect >= 0 ? "text-blue-600" : "text-red-500"}`}>
                                                            {exp.netEffect >= 0 ? `+₹${exp.netEffect.toFixed(2)}` : `-₹${Math.abs(exp.netEffect).toFixed(2)}`}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400">
                                                            {exp.userPaid > 0 && `Paid: ${exp.currency === 'USD' ? '$' : '₹'}${exp.originalAmount}`}
                                                            {exp.userPaid > 0 && exp.userSplit > 0 && " | "}
                                                            {exp.userSplit > 0 && `Owed Share: ₹${exp.userSplit.toFixed(2)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-150 pt-5">
                <h3 className="font-bold text-xl text-slate-900 mb-3 flex items-center justify-between">
                    <span>Simplified Debts</span>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                        Aisha's Plan
                    </span>
                </h3>
                {simplifiedDebts.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center italic">
                        ✓ All debts settled! No payments required.
                    </p>
                ) : (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {simplifiedDebts.map((tx, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-200/50 last:border-0 last:pb-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-700 capitalize">{tx.from.split("@")[0]}</span>
                                    <span className="text-slate-400 text-xs">pays</span>
                                    <span className="font-bold text-slate-700 capitalize">{tx.to.split("@")[0]}</span>
                                </div>
                                <span className="font-bold text-green-600">₹{tx.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpenseSummary;
