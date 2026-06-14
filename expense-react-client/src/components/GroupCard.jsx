import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { serverEndpoint } from "../config/appConfig";

function GroupCard({ group, onUpdate }) {
    const [showMembers, setShowMembers] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [errors, setErrors] = useState({});

    const handleShowMember = () => setShowMembers(!showMembers);

    const handleAddMember = async () => {
        if (memberEmail.length === 0) return;

        try {
            const response = await axios.patch(
                `${serverEndpoint}/groups/members/add`,
                {
                    groupId: group._id,
                    emails: [memberEmail],
                },
                { withCredentials: true }
            );
            setMemberEmail("");
            onUpdate(response.data);
        } catch (error) {
            console.log(error);
            setErrors({ message: "Unable to add member" });
        }
    };

    return (
        <div className="h-full rounded-2xl bg-white border-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <div className="p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600 mb-2">
                        <i className="text-2xl">≡</i>
                    </div>
                    {group.adminEmail && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-normal text-sm px-3 py-1">
                            Admin: {group.adminEmail.split("@")[0]}
                        </span>
                    )}
                </div>

                <h5 className="font-bold mb-1 text-slate-900 truncate">
                    {group.name}
                </h5>

                <button
                    className="inline-flex items-center text-blue-600 text-sm font-medium text-left p-0 mb-3 hover:text-blue-700"
                    onClick={handleShowMember}
                >
                    <i className="mr-1 text-sm">👥</i>
                    {group.membersEmail.length} Members{" "}
                    {showMembers ? "▴" : "▾"}
                </button>

                <p className="text-slate-500 text-sm mb-3 flex-grow-1">
                    {group.description || "No description provided."}
                </p>

                <Link
                    to={`/groups/${group._id}`}
                    className="inline-flex items-center justify-center rounded-full border border-blue-600 text-blue-600 text-sm font-bold mb-4 w-full py-2 hover:bg-blue-50"
                >
                    View & Add Expenses
                </Link>

                {showMembers && (
                    <div className="bg-slate-100 rounded-xl p-3 mb-4 border-0 shadow-inner">
                        <h6 className="text-[11px] font-bold uppercase text-slate-500 mb-3">
                            Member List
                        </h6>
                        <div
                            className="overflow-auto"
                            style={{ maxHeight: "150px" }}
                        >
                            {group.membersEmail.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-center mb-2 last:mb-0"
                                >
                                    <div
                                        className="rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 font-bold text-blue-600 shadow-sm"
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            fontSize: "10px",
                                        }}
                                    >
                                        {member.charAt(0).toUpperCase()}
                                    </div>
                                    <span
                                        className="text-sm text-slate-900 truncate"
                                        title={member}
                                    >
                                        {member}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {errors.message && (
                    <div className="mb-3 rounded-md border-0 bg-red-50 px-2 py-1 text-sm text-red-700">
                        {errors.message}
                    </div>
                )}

                <div className="mt-auto pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-2">
                        Invite a Friend
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="email"
                            className="flex-1 rounded-lg bg-slate-100 border border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="email@example.com"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                        />
                        <button
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                            onClick={handleAddMember}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GroupCard;
