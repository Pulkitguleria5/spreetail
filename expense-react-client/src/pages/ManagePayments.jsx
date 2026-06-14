import { useEffect, useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

const CREDITS_PACK = [
  { price: 1, credits: 10 },
  { price: 4, credits: 50 },
  { price: 7, credits: 100 },
];

function ManagePayments() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [selectedCredits, setSelectedCredits] = useState(null);
  const[messsage, setMessage] = useState(null);

  // 🔹 Fetch user profile
  const getUserProfile = async () => {
    try {
      const response = await axios.get(
        `${serverEndpoint}/profile/get-user-info`,
        { withCredentials: true }
      );
      setUserProfile(response.data.user);
    } catch (error) {
      console.log(error);
      setErrors({ message: "Unable to fetch user profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  // 🔹 Handle successful payment
  const paymentResponseHandler = async (credits,payment) => {
    try {
      const response = await axios.post(
        `${serverEndpoint}/payments/verify-order`,
        {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
          credits: credits,
        },
        { withCredentials: true }
      );

      setUserProfile(response.data.user);
      setMessage("Payment successful! Your credits have been updated.");
    } catch (error) {
      console.log(error);
       setErrors({ message: error.message });
    }
  };

  // 🔹 Handle payment click
  const handlePayment = async (credits) => {
    try {
      setLoading(true);

      const orderResponse = await axios.post(
        `${serverEndpoint}/payments/create-order`,
        { credits: credits },
        { withCredentials: true }
      );

      const order = orderResponse.data.order;
      setSelectedCredits(credits);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "MergeMoney",
        description: `Purchase ${credits} credits`,
        order_id: order.id,
        theme: { color: "#6366f1" },
        handler: (response) => { paymentResponseHandler(credits, response) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      setErrors({ message: "Unable to process payment request." });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Loading Spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Error Message */}
      {errors.message && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
          {errors.message}
        </div>
      )}

        {/* Success Message */}
        {messsage && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-6">
          {messsage}
        </div>
      )}


      {/* Heading */}
      <h2 className="text-3xl font-bold mb-4 text-gray-800">
        Manage Payments
      </h2>

      {/* Current Credits */}
      <div className="bg-indigo-50 p-4 rounded-xl mb-8 shadow-sm">
        <p className="text-lg font-semibold text-indigo-700">
          Current Credit Balance:{" "}
          <span className="text-indigo-900">
            {userProfile?.credits || 0}
          </span>
        </p>
      </div>

      {/* Credit Packages */}
      <div className="grid md:grid-cols-3 gap-6">
        {CREDITS_PACK.map((credit, index) => (
          <div
            key={index}
            className="border rounded-2xl p-6 shadow-md hover:shadow-lg transition duration-300"
          >
            <h4 className="text-xl font-bold mb-2">
              {credit.credits} Credits
            </h4>

            <p className="text-gray-600 mb-4">
              Buy {credit.credits} credits for ₹{credit.price}
            </p>

            <button
              onClick={() => { handlePayment(credit.credits); }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManagePayments;
