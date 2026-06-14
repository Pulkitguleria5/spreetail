import axios from "axios";
import { useState } from "react";
import { serverEndpoint } from "../config/appConfig";
import { useSelector } from "react-redux";

function CreateGroupModal({ show, onHide, onSuccess }) {
    const user = useSelector((state) => state.userDetails);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        let isValid = true;
        const newErrors = {};

        if (formData.name.trim().length < 3) {
            newErrors.name = "Group name should be at least 3 characters";
            isValid = false;
        }

        if (formData.description.trim().length < 5) {
            newErrors.description =
                "Please provide a slightly longer description (min 5 chars)";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            setLoading(true);
            try {
                const response = await axios.post(
                    `${serverEndpoint}/groups/create`,
                    { name: formData.name, description: formData.description },
                    { withCredentials: true }
                );

                const groupId = response.data.groupId;

                onSuccess({
                    name: formData.name,
                    description: formData.description,
                    _id: groupId,
                    membersEmail: [user.email],
                    adminEmail: user.email,
                    paymentStatus: {
                        amount: 0,
                        currency: "INR",
                        date: new Date().toISOString(),
                        isPaid: false,
                    },
                });

                setFormData({ name: "", description: "" });
                onHide();
            } catch (error) {
                console.error(error);
                setErrors({
                    message: "Something went wrong. Please try again later.",
                });
            } finally {
                setLoading(false);
            }
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            tabIndex="-1"
            style={{
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
            }}
        >
            <div className="w-full max-w-xl px-4">
                <div className="bg-white border-0 rounded-2xl shadow-lg p-3">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-start gap-3 pb-0 border-b-0">
                            <div className="bg-blue-600/10 p-2 rounded-lg mr-3 text-blue-600">
                                <i className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-2xl w-8 h-8">
                                    +
                                </i>
                            </div>
                            <h5 className="font-bold mb-0 flex-1">Start a New Circle</h5>
                            <button
                                type="button"
                                className="ml-auto h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none before:content-['×'] before:text-xl before:leading-none"
                                onClick={onHide}
                            ></button>
                        </div>

                        <div className="py-4">
                            <p className="text-slate-500 text-sm mb-4">
                                Create a shared space to manage bills with your
                                friends, roommates, or travel partners.
                            </p>

                            {errors.message && (
                                <div className="mb-3 rounded-md border-0 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errors.message}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Goa Trip 2026"
                                    className={`w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.name ? "border-red-500 focus:ring-red-500" : ""
                                    }`}
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                />
                                {errors.name && (
                                    <div className="mt-1 pl-1 text-sm text-red-600">
                                        {errors.name}
                                    </div>
                                )}
                            </div>

                            <div className="mb-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="What is this group for?"
                                    className={`w-full rounded-lg bg-slate-100 border border-transparent px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.description ? "border-red-500 focus:ring-red-500" : ""
                                    }`}
                                    name="description"
                                    value={formData.description}
                                    onChange={onChange}
                                />
                                {errors.description && (
                                    <div className="mt-1 pl-1 text-sm text-red-600">
                                        {errors.description}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t-0 pt-0">
                            <button
                                type="button"
                                className="rounded-full bg-white border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={onHide}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-blue-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span
                                            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2 align-middle"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Creating...
                                    </>
                                ) : (
                                    "Create Group"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;
