import { useState } from "react";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { serverEndpoint } from "../config/appConfig";
import { useDispatch } from "react-redux";
import { SET_USER } from "../redux/user/action";
import { Link } from "react-router-dom";

function Login() {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        let newErrors = {};
        let isValid = true;

        if (formData.email.length === 0) {
            newErrors.email = "Email is required";
            isValid = false;
        }

        if (formData.password.length === 0) {
            newErrors.password = "Password is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleFormSubmit = async (event) => {
        // Prevent default behaviour of form which is to do complete page reload.
        event.preventDefault();

        if (validate()) {
            try {
                const body = {
                    email: formData.email,
                    password: formData.password,
                };
                const config = { withCredentials: true };
                const response = await axios.post(
                    `${serverEndpoint}/auth/login`,
                    body,
                    config
                );
                // setUser(response.data.user);
                dispatch({
                    type: SET_USER,
                    payload: response.data.user,
                });
            } catch (error) {
                console.log(error);
                setErrors({
                    message: "Something went wrong, please try again",
                });
            }
        }
    };

    const handleGoogleSuccess = async (authResponse) => {
        try {
            const body = {
                idToken: authResponse?.credential,
            };
            const response = await axios.post(
                `${serverEndpoint}/auth/google-auth`,
                body,
                { withCredentials: true }
            );
            dispatch({
                type: SET_USER,
                payload: response.data.user,
            });
        } catch (error) {
            console.log(error);
            setErrors({
                message: "Unable to process google sso, please try again",
            });
        }
    };

    const handleGoogleFailure = (error) => {
        console.log(error);
        setErrors({
            message:
                "Something went wrong while performing google single sign-on",
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-5">
            <div className="flex justify-center">
                <div className="w-full md:w-5/12">
                    {/* Main Login Card */}
                    <div className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
                        <div className="p-5">
                            {/* Brand Header */}
                            <div className="text-center mb-4">
                                <h2 className="font-bold text-slate-900 text-3xl">
                                    Welcome{" "}
                                    <span className="text-blue-600">Back</span>
                                </h2>
                                <p className="text-slate-500">
                                    Login to manage your MergeMoney account
                                </p>
                            </div>

                            {/* Global Alerts */}
                            {(message || errors.message) && (
                                <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
                                    <i className="mr-2 text-base">⚠</i>
                                    {message || errors.message}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        className={`w-full rounded-lg border border-slate-200 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.email
                                                ? "border-red-500 focus:ring-red-500"
                                                : ""
                                        }`}
                                        type="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <div className="mt-1 text-sm text-red-600">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        Password
                                    </label>
                                    <input
                                        className={`w-full rounded-lg border border-slate-200 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.password
                                                ? "border-red-500 focus:ring-red-500"
                                                : ""
                                        }`}
                                        type="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        onChange={handleChange}
                                    />
                                    {errors.password && (
                                        <div className="mt-1 text-sm text-red-600">
                                            {errors.password}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center">
                                    <button className="w-full rounded-full bg-blue-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-blue-700 mb-4">
                                        Sign In
                                    </button>
                                </div>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center my-2">
                                <hr className="flex-grow border-t border-slate-200" />
                                <span className="mx-3 text-slate-500 text-sm font-bold">
                                    OR
                                </span>
                                <hr className="flex-grow border-t border-slate-200" />
                            </div>

                            {/* Google Social Login */}
                            <div className="flex justify-center w-100">
                                <GoogleOAuthProvider
                                    clientId={
                                        import.meta.env.VITE_GOOGLE_CLIENT_ID
                                    }
                                >
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleFailure}
                                        theme="outline"
                                        shape="pill"
                                        text="signin_with"
                                        width="500"
                                    />
                                </GoogleOAuthProvider>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
