import { useState, useEffect } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

const knownNames = ['Aisha', 'Rohan', 'Priya', 'Meera', 'Dev', 'Sam'];

function ImportExpenses() {
    const [file, setFile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [scannedData, setScannedData] = useState(null);
    const [resolvedRows, setResolvedRows] = useState([]);
    const [importBatchId, setImportBatchId] = useState("");
    const [importReport, setImportReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/groups/my-groups`, { withCredentials: true });
            const groupsList = response.data.groups || [];
            setGroups(groupsList);
            if (groupsList.length > 0) {
                setSelectedGroupId(groupsList[0]._id);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    const handleCreateDefaultGroup = async () => {
        try {
            setLoading(true);
            // Create a default group with members
            const response = await axios.post(
                `${serverEndpoint}/groups/create`,
                {
                    name: "Flatmates Group",
                    description: "Flatmates Shared Expenses (February - May)",
                    membersEmail: [
                        "aisha@example.com",
                        "rohan@example.com",
                        "priya@example.com",
                        "meera@example.com",
                        "sam@example.com",
                        "dev@example.com"
                    ]
                },
                { withCredentials: true }
            );

            await fetchGroups();
            alert("Default flatmates group created successfully!");
        } catch (error) {
            console.error("Error creating default group:", error);
            alert("Failed to create default group: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a CSV file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const response = await axios.post(
                `${serverEndpoint}/api/import/csv`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" }
                }
            );

            setScannedData(response.data);
            setImportBatchId(response.data.importBatchId);
            setResolvedRows(response.data.rows);
            setImportReport(null);
        } catch (error) {
            console.error("CSV Upload failed:", error);
            alert("CSV scan failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const updateResolvedData = (idx, field, value) => {
        const updated = [...resolvedRows];
        const row = updated[idx];
        row.resolvedData = {
            ...row.resolvedData,
            [field]: value
        };

        // If amount was edited, check for rounding/formatting
        if (field === "amount") {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                row.resolvedData.amount = num;
            }
        }

        // Re-evaluate if it's importable (e.g. if paid_by is now populated)
        if (row.resolvedData.paidBy && row.resolvedData.amount && row.resolvedData.date) {
            row.isImportable = true;
        }

        setResolvedRows(updated);
    };

    const handleToggleSkip = (idx) => {
        const updated = [...resolvedRows];
        updated[idx].skipImport = !updated[idx].skipImport;
        setResolvedRows(updated);
    };

    const handleAutoNormalizePercentages = (idx) => {
        const updated = [...resolvedRows];
        const row = updated[idx];
        const details = row.resolvedData.splitDetails || "";

        try {
            const items = details.split(";").map(s => s.trim()).filter(s => s.length > 0);
            let sumPct = 0;
            const parsed = items.map(item => {
                const parts = item.split(/\s+/);
                const valStr = parts[parts.length - 1];
                const name = parts.slice(0, parts.length - 1).join(" ");
                const val = parseFloat(valStr.replace("%", ""));
                sumPct += val;
                return { name, val };
            });

            if (sumPct > 0) {
                const normalizedDetails = parsed.map(item => {
                    const normVal = ((item.val / sumPct) * 100).toFixed(1);
                    return `${item.name} ${normVal}%`;
                }).join("; ");

                row.resolvedData.splitDetails = normalizedDetails;
                
                // Clear percentage sum error from anomalies list
                row.anomalies = row.anomalies.filter(a => a.type !== "INVALID_PERCENTAGE_SUM");
                row.isImportable = true;
                row.actionTaken = "Normalized split percentages to sum to 100%.";
            }
        } catch (e) {
            alert("Could not auto-normalize: " + e.message);
        }

        setResolvedRows(updated);
    };

    const handleAbsorbFriendKabir = (idx) => {
        const updated = [...resolvedRows];
        const row = updated[idx];
        // Remove Dev's Friend Kabir from split_with, and the remaining amount gets divided, or absorb Kabir's share.
        // Let's modify split_with to only Aisha;Rohan;Priya;Dev
        if (row.resolvedData.splitWith.includes("Kabir")) {
            row.resolvedData.splitWith = "Aisha;Rohan;Priya;Dev";
            row.anomalies = row.anomalies.filter(a => a.type !== "EXTERNAL_MEMBER");
            row.actionTaken = "Removed external guest Kabir. Kabir's share absorbed by group.";
        }
        setResolvedRows(updated);
    };

    const handleTimelineOverride = (idx) => {
        const updated = [...resolvedRows];
        const row = updated[idx];
        row.anomalies = row.anomalies.filter(a => a.type !== "MEMBER_OUTSIDE_TIMELINE" && a.type !== "PAYER_OUTSIDE_TIMELINE");
        row.actionTaken = "Overrode membership timeline validation for this transaction.";
        setResolvedRows(updated);
    };

    const handleExecuteImport = async () => {
        if (!selectedGroupId) {
            alert("Please select a group to import into.");
            return;
        }

        // Check if there are any non-importable rows that aren't skipped
        const blockingRow = resolvedRows.find(r => !r.isImportable && !r.skipImport);
        if (blockingRow) {
            alert(`Row ${blockingRow.rowNumber} has unresolved errors. Please fix them or choose to skip the row.`);
            return;
        }

        setImporting(true);
        try {
            const response = await axios.post(
                `${serverEndpoint}/api/import/execute`,
                {
                    groupId: selectedGroupId,
                    importBatchId,
                    resolvedRows
                },
                { withCredentials: true }
            );

            setImportReport(response.data);
            setScannedData(null);
            setResolvedRows([]);
            setFile(null);
            alert("Import executed successfully!");
        } catch (error) {
            console.error("Import execution failed:", error);
            alert("Import execution failed: " + (error.response?.data?.message || error.message));
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">CSV Data Importer</h2>
            <p className="text-slate-500 mb-6">Ingest expense spreadsheet files, detect and resolve anomalies interactively, and record imports.</p>

            {/* Target Group Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Select Target Group
                    </label>
                    {groups.length === 0 ? (
                        <p className="text-sm text-red-500 font-semibold">No groups found. Please create a group first.</p>
                    ) : (
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            disabled={loading || importing}
                        >
                            {groups.map((g) => (
                                <option key={g._id} value={g._id}>
                                    {g.name} ({g.membersEmail.length} members)
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCreateDefaultGroup}
                        className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold transition-colors disabled:opacity-50"
                        disabled={loading || importing}
                    >
                        Create Flatmates Group
                    </button>
                </div>
            </div>

            {/* Upload form */}
            {!scannedData && !importReport && (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center bg-white hover:border-blue-500 transition-colors">
                    <span className="text-5xl mb-4 block">📥</span>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Upload expenses_export.csv</h3>
                    <p className="text-sm text-slate-500 mb-6">Upload the raw spreadsheet export without manual pre-editing.</p>
                    
                    <div className="inline-flex items-center justify-center gap-3">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="hidden"
                            id="csv-file-input"
                            disabled={loading}
                        />
                        <label
                            htmlFor="csv-file-input"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer border border-slate-200 transition-colors"
                        >
                            {file ? file.name : "Select File"}
                        </label>
                        {file && (
                            <button
                                onClick={handleUpload}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Scanning..." : "Upload & Scan"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Scanned records and resolution wizard */}
            {scannedData && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Scanned CSV Records</h3>
                            <p className="text-sm text-slate-500">
                                Found {scannedData.totalRows} rows and {scannedData.anomaliesCount} data anomalies. Resolve conflicts below.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setScannedData(null)}
                                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteImport}
                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                                disabled={importing}
                            >
                                {importing ? "Importing..." : "Approve & Import"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[60vh]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 w-12 text-center">Row</th>
                                        <th className="p-4 w-24">Import</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 w-28">Payer</th>
                                        <th className="p-4 w-32 text-right">Amount</th>
                                        <th className="p-4">Currency</th>
                                        <th className="p-4">Split Details</th>
                                        <th className="p-4">Anomalies & Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {resolvedRows.map((item, idx) => {
                                        const original = item.originalData;
                                        const resolved = item.resolvedData;
                                        const anomalies = item.anomalies || [];
                                        const hasError = anomalies.some(a => a.severity === "ERROR");
                                        const hasWarning = anomalies.some(a => a.severity === "WARNING");
                                        const isSkipped = item.skipImport;

                                        return (
                                            <tr key={idx} className={`${isSkipped ? "opacity-50 bg-slate-50" : ""} hover:bg-slate-50/55 transition-colors`}>
                                                <td className="p-4 font-semibold text-slate-400 text-center">{item.rowNumber}</td>
                                                <td className="p-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSkip(idx)}
                                                        className={`text-xs px-2.5 py-1 rounded font-bold border transition-colors ${
                                                            isSkipped 
                                                                ? "bg-slate-100 border-slate-300 text-slate-500" 
                                                                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                        }`}
                                                    >
                                                        {isSkipped ? "Skipped" : "Importing"}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="date"
                                                        value={resolved.date}
                                                        onChange={(e) => updateResolvedData(idx, "date", e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-600 focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={resolved.description}
                                                        onChange={(e) => updateResolvedData(idx, "description", e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none w-full min-w-32"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={resolved.paidBy}
                                                        onChange={(e) => updateResolvedData(idx, "paidBy", e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-700 focus:outline-none capitalize"
                                                    >
                                                        <option value="">Select Payer</option>
                                                        {knownNames.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={resolved.amount || ""}
                                                        onChange={(e) => updateResolvedData(idx, "amount", e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-700 text-right focus:outline-none w-20"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={resolved.currency}
                                                        onChange={(e) => updateResolvedData(idx, "currency", e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-700 focus:outline-none"
                                                    >
                                                        <option value="INR">INR (₹)</option>
                                                        <option value="USD">USD ($)</option>
                                                    </select>
                                                </td>
                                                <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap overflow-hidden max-w-44 text-ellipsis">
                                                    {resolved.isSettlement ? (
                                                        <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            P2P Settlement
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Type: {resolved.splitType}<br/>
                                                            Split: {resolved.splitWith || "All"}
                                                            {resolved.splitDetails && <><br/>Details: {resolved.splitDetails}</>}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 space-y-1 min-w-56">
                                                    {anomalies.map((anom, aIdx) => (
                                                        <div key={aIdx} className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`h-2 w-2 rounded-full ${
                                                                    anom.severity === "ERROR" 
                                                                        ? "bg-red-500 animate-pulse" 
                                                                        : anom.severity === "WARNING" 
                                                                            ? "bg-amber-500" 
                                                                            : "bg-blue-400"
                                                                }`}></span>
                                                                <span className={`text-[11px] font-semibold ${
                                                                    anom.severity === "ERROR" 
                                                                        ? "text-red-700" 
                                                                        : anom.severity === "WARNING" 
                                                                            ? "text-amber-700" 
                                                                            : "text-slate-600"
                                                                }`}>
                                                                    {anom.message}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Resolution Widgets */}
                                                            {anom.type === "INVALID_PERCENTAGE_SUM" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAutoNormalizePercentages(idx)}
                                                                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded self-start font-medium transition-colors"
                                                                >
                                                                    Auto-Normalize to 100%
                                                                </button>
                                                            )}
                                                            {anom.type === "EXTERNAL_MEMBER" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAbsorbFriendKabir(idx)}
                                                                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded self-start font-medium transition-colors"
                                                                >
                                                                    Absorb Guest Share (Dev)
                                                                </button>
                                                            )}
                                                            {(anom.type === "MEMBER_OUTSIDE_TIMELINE" || anom.type === "PAYER_OUTSIDE_TIMELINE") && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTimelineOverride(idx)}
                                                                    className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded self-start font-medium transition-colors"
                                                                >
                                                                    Override Timeline check
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {anomalies.length === 0 && (
                                                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                                            ✓ No anomalies
                                                        </span>
                                                    )}
                                                    {item.actionTaken && (
                                                        <div className="text-[10px] text-slate-400 italic font-semibold mt-1">
                                                            Action: {item.actionTaken}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Import Report Display */}
            {importReport && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="text-center pb-4 border-b border-slate-100">
                        <span className="text-5xl block mb-2">🎉</span>
                        <h3 className="text-2xl font-bold text-slate-800">Import Report Generated</h3>
                        <p className="text-sm text-slate-500">The CSV data has been processed and saved successfully.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                            <span className="block text-2xl font-extrabold text-blue-600">{importReport.expensesImported}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expenses Imported</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                            <span className="block text-2xl font-extrabold text-amber-600">{importReport.reportsCreated}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anomalies Addressed</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                            <span className="block text-xs font-mono text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap mt-1.5">{importBatchId.slice(0, 8)}...</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mt-1">Batch ID</span>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <h4 className="text-lg font-bold text-slate-800">Anomaly Audit Log</h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2.5">
                            {resolvedRows.filter(r => r.anomalies && r.anomalies.length > 0).map((row, idx) => (
                                <div key={idx} className="text-xs border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-slate-700">Row {row.rowNumber}: {row.originalData.description}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${row.skipImport ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-800"}`}>
                                            {row.skipImport ? "SKIPPED" : "RESOLVED"}
                                        </span>
                                    </div>
                                    <ul className="list-disc pl-4 space-y-0.5 text-slate-500 font-medium">
                                        {row.anomalies.map((a, aIdx) => (
                                            <li key={aIdx}>{a.message}</li>
                                        ))}
                                    </ul>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                                        Action Taken: {row.actionTaken || (row.skipImport ? "Skipped row import." : "Cleaned up spelling, formatted numbers, or parsed splits.")}
                                    </p>
                                </div>
                            ))}
                            {resolvedRows.filter(r => r.anomalies && r.anomalies.length > 0).length === 0 && (
                                <p className="text-slate-500 text-sm italic text-center py-4">No anomalies logged in this batch.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            onClick={() => setImportReport(null)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors"
                        >
                            Import Another File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImportExpenses;