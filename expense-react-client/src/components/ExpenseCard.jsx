function ExpenseCard({ expense }) {
    return (
        <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-350 transition-colors bg-white">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-slate-900">{expense.description}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Paid by <span className="font-semibold capitalize">{expense.paidBy.split("@")[0]}</span> • {new Date(expense.date).toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-slate-900">₹{expense.amount.toFixed(2)}</p>
                    {expense.currency && expense.currency !== "INR" && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Original: {expense.currency === 'USD' ? '$' : expense.currency}{expense.originalAmount.toFixed(2)} <span className="text-[10px] text-slate-300">(@ {expense.exchangeRate})</span>
                        </p>
                    )}
                    {expense.settled ? (
                        <span className="inline-block bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-green-200/50 mt-1">
                            Settled
                        </span>
                    ) : (
                        expense.imported && (
                            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-200/50 mt-1">
                                Imported
                            </span>
                        )
                    )}
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Split Allocations ({expense.splitType || 'EXACT'})
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {expense.split.map((splitItem, idx) => (
                        <span key={idx} className="text-xs bg-slate-50 border border-slate-200/60 text-slate-700 px-2 py-1 rounded-lg font-medium">
                            <span className="capitalize">{splitItem.userEmail.split("@")[0]}</span>: <span className="font-bold text-slate-900">₹{splitItem.splitAmount.toFixed(2)}</span>
                        </span>
                    ))}
                </div>
                {expense.excludedMembers && expense.excludedMembers.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Excluded from split: {expense.excludedMembers.map(email => email.split("@")[0]).join(", ")}
                    </p>
                )}
            </div>
        </div>
    );
}

export default ExpenseCard;
