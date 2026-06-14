import axios from "axios";
import { useEffect, useState } from "react";
import { serverEndpoint } from "../config/appConfig";

const PLAN_IDS = {
  UNLIMITED_MONTHLY: {
    planName: "Unlimited Monthly",
    price: 5,
    frequency: "monthly",
  },
  UNLIMITED_YEARLY: {
    planName: "Unlimited Yearly",
    price: 50,
    frequency: "yearly",
  },
};

function ManageSubscription() {
  const [userProfile, setUserProfile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const getUserProfile = async () => {
    try {
      const response = await axios.get(
        `${serverEndpoint}/profile/get-user-info`,
        { withCredentials: true }  
      );
      setUserProfile(response.data.user);
    } catch (error) {
      console.log(error);
      setErrors("Unable to fetch subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  // After successful Razorpay payment
  const rzpResponseHandler = async (response) => {
    try {
      setLoading(true);

      const captureSubsResponse = await axios.post(
        `${serverEndpoint}/payments/capture-subscription`,
        { subscriptionId: response.razorpay_subscription_id },
        { withCredentials: true }
      );

      setUserProfile(captureSubsResponse.data.user);
      setMessage("Subscription created successfully!");
    } catch (error) {
      console.log(error);
      setErrors("Unable to capture subscription details.");
    } finally {
      setLoading(false);
    }
  };

  // When user clicks Subscribe
  const handleSubscribe = async (planName) => {
    try {
      setLoading(true);

      const createSubscriptionResponse = await axios.post(
        `${serverEndpoint}/payments/create-subscription`,
        { plan_name: planName },
        { withCredentials: true }
      );

      const subscription = createSubscriptionResponse.data.subscription;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        name: PLAN_IDS[planName].planName,
        description: `Pay INR ${PLAN_IDS[planName].price} ${PLAN_IDS[planName].frequency}`,
        subscription_id: subscription.id,
        theme: { color: "#6366f1" },
        handler: (response) => rzpResponseHandler(response),
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log(error);
      setErrors("Unable to process subscription request");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const notSubscribedStatus = [undefined, "completed", "cancelled"];
  const showSubscription = notSubscribedStatus.includes(
    userProfile?.subscription?.status
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Manage Subscription</h2>

      {errors && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {errors}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </div>
      )}

      {/* Show Plans */}
      {showSubscription && (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.keys(PLAN_IDS).map((key) => (
            <div
              key={key}
              className="border rounded-xl p-6 shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">
                {PLAN_IDS[key].planName}
              </h3>

              <p className="text-gray-600 mb-4">
                Pay INR {PLAN_IDS[key].price}{" "}
                {PLAN_IDS[key].frequency}
              </p>

              <button
                onClick={() => handleSubscribe(key)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Show Active Subscription */}
      {!showSubscription && (
        <div className="border rounded-xl p-6 shadow bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">
            Active Subscription
          </h3>

          <p className="mb-2">
            <strong>Plan ID:</strong>{" "}
            {userProfile.subscription.planId}
          </p>

          <p className="mb-2">
            <strong>Subscription ID:</strong>{" "}
            {userProfile.subscription.subscriptionId}
          </p>

          <p className="mb-2">
            <strong>Status:</strong>{" "}
            <span className="text-green-600 font-medium">
              {userProfile.subscription.status}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default ManageSubscription;