import { useState, useEffect } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function AddExpenseModal({ show, onHide, group, onSuccess }) {
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        paidBy: "",
        splitType: "EQUAL",
        currency: "INR"
    });
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [splitAmounts, setSplitAmounts] = useState({});
    const [splitPercentages, setSplitPercentages] = useState({});
    const [splitShares, setSplitShares] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (group && group.membersEmail.length > 0) {
            if (!formData.paidBy) {
                setFormData(prev => ({ ...prev, paidBy: group.membersEmail[0] }));
            }
            // By default, select all members for the split
            setSelectedMembers(group.membersEmail);
        }
    }, [group]);

    // Re-calculate equal splits whenever amount or selected members change
    useEffect(() => {
        if (formData.splitType === 'EQUAL') {
            recalculateEqualSplits();
        }
    }, [formData.amount, selectedMembers, formData.splitType]);

    const recalculateEqualSplits = () => {
        if (!formData.amount || selectedMembers.length === 0) return;
        const total = parseFloat(formData.amount);
        const shareCount = selectedMembers.length;
        const baseShare = Math.floor((total / shareCount) * 100) / 100;
        let sum = 0;

        const newSplitAmounts = {};
        selectedMembers.forEach((email, idx) => {
            const splitAmount = idx === shareCount - 1 ? (total - sum) : baseShare;
            sum += splitAmount;
            newSplitAmounts[email] = splitAmount.toFixed(2);
        });
        setSplitAmounts(newSplitAmounts);
    };

    const handleMemberToggle = (email) => {
        if (selectedMembers.includes(email)) {
            setSelectedMembers(selectedMembers.filter(e => e !== email));
            
            const newSplitAmounts = { ...splitAmounts };
            delete newSplitAmounts[email];
            setSplitAmounts(newSplitAmounts);

            const newSplitPercentages = { ...splitPercentages };
            delete newSplitPercentages[email];
            setSplitPercentages(newSplitPercentages);

            const newSplitShares = { ...splitShares };
            delete newSplitShares[email];
            setSplitShares(newSplitShares);
        } else {
            setSelectedMembers([...selectedMembers, email]);
            setSplitAmounts({ ...splitAmounts, [email]: "" });
            setSplitPercentages({ ...splitPercentages, [email]: "" });
            setSplitShares({ ...splitShares, [email]: "1" }); // Default 1 share
        }
    };

    const handleSplitAmountChange = (email, val) => {
        setSplitAmounts({ ...splitAmounts, [email]: val });
        if (errors.split) setErrors({ ...errors, split: null });
    };

    const handleSplitPercentageChange = (email, val) => {
        setSplitPercentages({ ...splitPercentages, [email]: val });
        if (errors.split) setErrors({ ...errors, split: null });
    };

    const handleSplitShareChange = (email, val) => {
        setSplitShares({ ...splitShares, [email]: val });
        if (errors.split) setErrors({ ...errors, split: null });
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }
        
        if (!formData.paidBy) {
            newErrors.paidBy = "Please select who paid";
        }
        
        if (selectedMembers.length === 0) {
            newErrors.split = "Please select at least one member to split with";
        }

        const totalAmount = parseFloat(formData.amount || 0);

        if (formData.splitType === 'EXACT') {
            const totalSplit = selectedMembers.reduce((sum, email) => {
                return sum + parseFloat(splitAmounts[email] || 0);
            }, 0);
            if (Math.abs(totalSplit - totalAmount) > 0.02) {
                newErrors.split = `Split amounts (₹${totalSplit.toFixed(2)}) must sum up to total amount (₹${totalAmount.toFixed(2)})`;
            }
        } else if (formData.splitType === 'PERCENTAGE') {
            const totalPct = selectedMembers.reduce((sum, email) => {
                return sum + parseFloat(splitPercentages[email] || 0);
            }, 0);
            if (Math.abs(totalPct - 100) > 0.1) {
                newErrors.split = `Percentages sum up to ${totalPct.toFixed(1)}% but must equal exactly 100%`;
            }
        } else if (formData.splitType === 'SHARE') {
            const totalShares = selectedMembers.reduce((sum, email) => {
                return sum + parseFloat(splitShares[email] || 0);
            }, 0);
            if (totalShares <= 0) {
                newErrors.split = "Total shares must be greater than 0";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;

        setLoading(true);
        try {
            // Build the appropriate split payload
            const split = selectedMembers.map(email => {
                const item = { userEmail: email };
                if (formData.splitType === 'PERCENTAGE') {
                    item.percentage = parseFloat(splitPercentages[email]);
                } else if (formData.splitType === 'SHARE') {
                    item.share = parseFloat(splitShares[email]);
                } else if (formData.splitType === 'EXACT') {
                    item.splitAmount = parseFloat(splitAmounts[email]);
                } else {
                    // EQUAL
                    item.splitAmount = parseFloat(splitAmounts[email]);
                }
                return item;
            });

            await axios.post(
                `${serverEndpoint}/expenses/create`,
                {
                    groupId: group._id,
                    description: formData.description,
                    amount: parseFloat(formData.amount),
                    date: formData.date,
                    paidBy: formData.paidBy,
                    splitType: formData.splitType,
                    split
                },
                { withCredentials: true }
            );

            // Reset Form
            setFormData({
                description: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                paidBy: group?.membersEmail[0] || "",
                splitType: "EQUAL",
                currency: "INR"
            });
            setSelectedMembers(group?.membersEmail || []);
            setSplitAmounts({});
            setSplitPercentages({});
            setSplitShares({});
            setErrors({});
            onSuccess();
            onHide();
        } catch (error) {
            console.error("Error creating expense:", error);
            setErrors({ 
                message: error.response?.data?.message || "Failed to create expense" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            description: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            paidBy: group?.membersEmail[0] || "",
            splitType: "EQUAL",
            currency: "INR"
        });
        setSelectedMembers(group?.membersEmail || []);
        setSplitAmounts({});
        setSplitPercentages({});
        setSplitShares({});
        setErrors({});
        onHide();
    };

    if (!show || !group) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center" 
            tabIndex="-1" 
            style={{ 
                backgroundColor: "rgba(15, 23, 42, 0.6)", 
                backdropFilter: "blur(4px)" 
            }}
        >
            <div className="w-full max-w-2xl px-4 max-h-[90vh] overflow-y-auto">
                <div className="bg-white border-0 rounded-2xl shadow-lg p-5">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-200 mb-4">
                            <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h5 className="font-bold mb-0 flex-1 text-xl">Add New Expense</h5>
                            <button
                                type="button"
                                className="ml-auto h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none before:content-['×'] before:text-xl before:leading-none"
                                onClick={handleClose}
                            ></button>
                        </div>

                        {errors.message && (
                            <div className="mb-4 rounded-md border-0 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {errors.message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Dinner at Thalassa"
                                    className={`w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.description ? "border-red-500 focus:ring-red-500" : ""
                                    }`}
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (errors.description) setErrors({ ...errors, description: null });
                                    }}
                                />
                                {errors.description && (
                                    <div className="mt-1 pl-1 text-sm text-red-600">{errors.description}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className={`w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.amount ? "border-red-500 focus:ring-red-500" : ""
                                        }`}
                                        value={formData.amount}
                                        onChange={(e) => {
                                            setFormData({ ...formData, amount: e.target.value });
                                            if (errors.amount) setErrors({ ...errors, amount: null });
                                        }}
                                    />
                                    {errors.amount && (
                                        <div className="mt-1 pl-1 text-sm text-red-600">{errors.amount}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Paid By
                                    </label>
                                    <select
                                        className="w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.paidBy}
                                        onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                                    >
                                        {group.membersEmail.map((email) => (
                                            <option key={email} value={email}>
                                                {email.split("@")[0]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        Split Method
                                    </label>
                                    <select
                                        className="w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.splitType}
                                        onChange={(e) => {
                                            setFormData({ ...formData, splitType: e.target.value });
                                            if (errors.split) setErrors({ ...errors, split: null });
                                        }}
                                    >
                                        <option value="EQUAL">Split Equally</option>
                                        <option value="EXACT">Exact / Unequal</option>
                                        <option value="PERCENTAGE">By Percentage (%)</option>
                                        <option value="SHARE">By Share Ratio</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">
                                        Split Details
                                    </label>
                                </div>
                                
                                {errors.split && (
                                    <div className="mb-2 text-sm text-red-600 font-medium">{errors.split}</div>
                                )}

                                <div className="space-y-3 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-3">
                                    {group.membersEmail.map((email) => {
                                        const isSelected = selectedMembers.includes(email);
                                        return (
                                            <div key={email} className="flex items-center gap-3 p-1 rounded hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleMemberToggle(email)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                />
                                                <label className="flex-1 text-slate-700 font-medium cursor-pointer" onClick={() => handleMemberToggle(email)}>
                                                    {email.split("@")[0]} <span className="text-xs text-slate-400">({email})</span>
                                                </label>
                                                {isSelected && (
                                                    <div className="flex items-center gap-1">
                                                        {formData.splitType === 'EQUAL' && (
                                                            <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                                ₹{splitAmounts[email] || "0.00"}
                                                            </div>
                                                        )}
                                                        {formData.splitType === 'EXACT' && (
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    className="w-28 rounded-lg bg-slate-50 border border-slate-200 pl-6 pr-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                                    value={splitAmounts[email] || ""}
                                                                    onChange={(e) => handleSplitAmountChange(email, e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                        {formData.splitType === 'PERCENTAGE' && (
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    placeholder="0"
                                                                    className="w-20 rounded-lg bg-slate-50 border border-slate-200 pl-2 pr-6 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                                    value={splitPercentages[email] || ""}
                                                                    onChange={(e) => handleSplitPercentageChange(email, e.target.value)}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                                            </div>
                                                        )}
                                                        {formData.splitType === 'SHARE' && (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="1"
                                                                    placeholder="1"
                                                                    className="w-20 rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                                                    value={splitShares[email] || ""}
                                                                    onChange={(e) => handleSplitShareChange(email, e.target.value)}
                                                                />
                                                                <span className="text-xs text-slate-400 font-semibold">shares</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-4">
                            <button
                                type="button"
                                className="rounded-full bg-white border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-blue-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? "Adding..." : "Add Expense"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddExpenseModal;
