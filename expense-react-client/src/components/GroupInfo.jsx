function GroupInfo({ group }) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-xl text-slate-900 mb-4">Group Members</h3>
            <div className="space-y-2">
                {group.membersEmail.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div 
                            className="rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-600" 
                            style={{ width: "32px", height: "32px", fontSize: "12px" }}
                        >
                            {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-900">{email}</span>
                        {email === group.adminEmail && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                Admin
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GroupInfo;

