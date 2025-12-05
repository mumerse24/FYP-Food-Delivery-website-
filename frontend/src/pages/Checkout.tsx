import React, { useState } from "react";
import { useCart } from "@/lib/cart-context";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaMapMarkerAlt, FaEnvelope, FaLandmark, FaCreditCard, FaRegMoneyBillAlt } from "react-icons/fa";

export default function CheckoutPage() {
  const { state: cart, dispatch } = useCart();
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    title: "Mr",
    fullName: "",
    mobileNumber: "",
    deliveryAddress: "",
    nearestLandmark: "",
    emailAddress: "",
    deliveryInstructions: "",
    paymentMethod: "cash", // cash, card, online
  });

  const [sendAsGift, setSendAsGift] = useState(false);
  const [changeRequest, setChangeRequest] = useState(500);
  const [voucherCode, setVoucherCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Mock order summary data
  const orderSummary = {
    subtotal: 210,
    tax: 240,
    deliveryFee: 150,
    discount: 510,
    grandTotal: 1990,
  };

  // Mock cart items
  const cartItems = [
    { id: 1, name: "2 x ONLINE DEAL 04", price: 1055, quantity: 2, description: "Choose Your Fast Food" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.items.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      // Map cart items to backend format
      const items = cart.items.map(item => ({
        menuItem: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: item.price * item.quantity,
        customizations: [],
        specialInstructions: "",
      }));

      const pricing = {
        subtotal: cart.total,
        deliveryFee: orderSummary.deliveryFee,
        serviceFee: 0,
        tax: orderSummary.tax,
        discount: orderSummary.discount,
        total: orderSummary.grandTotal,
      };

      const response = await axios.post("http://localhost:5000/api/orders", {
        customer: "customerId",
        restaurant: "restaurantId",
        items,
        pricing,
        deliveryAddress: form.deliveryAddress,
        contactInfo: {
          phone: form.mobileNumber,
          email: form.emailAddress,
          fullName: form.fullName,
        },
        additionalInfo: {
          nearestLandmark: form.nearestLandmark,
          deliveryInstructions: form.deliveryInstructions,
          sendAsGift,
          changeRequest,
        },
        paymentInfo: {
          method: form.paymentMethod,
        },
        orderType: "delivery",
        estimatedDeliveryTime: new Date(Date.now() + 30*60*1000),
      });

      alert("Order placed successfully! Order ID: " + response.data.orderNumber);
      dispatch({ type: "CLEAR_CART" });
      navigate("/order-success");

    } catch (err) {
      console.error(err);
      alert("Failed to place order. Try again!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-amber-500">●</span>
            This is a Delivery Order 💤
            <span className="text-amber-500">●</span>
          </p>
          <p className="text-gray-500 mt-1">Just a last step, please enter your details:</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Send as Gift */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Send as a Gift</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={sendAsGift}
                    onChange={(e) => setSendAsGift(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
              
              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title & Full Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="fullName"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaPhone className="inline mr-2 text-gray-400" />
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    name="mobileNumber"
                    placeholder="030x-xxxxxx"
                    value={form.mobileNumber}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaMapMarkerAlt className="inline mr-2 text-gray-400" />
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="deliveryAddress"
                    placeholder="Enter your complete address"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">AZAM B...</div>
                </div>

                {/* Nearest Landmark & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaLandmark className="inline mr-2 text-gray-400" />
                      Nearest Landmark
                    </label>
                    <input 
                      type="text" 
                      name="nearestLandmark"
                      placeholder="any famous place nearby"
                      value={form.nearestLandmark}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FaEnvelope className="inline mr-2 text-gray-400" />
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      name="emailAddress"
                      placeholder="Enter your email"
                      value={form.emailAddress}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Instructions
                  </label>
                  <textarea 
                    name="deliveryInstructions"
                    placeholder="Add special instructions for delivery"
                    value={form.deliveryInstructions}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${form.paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod"
                        value="cash"
                        checked={form.paymentMethod === 'cash'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <FaRegMoneyBillAlt className="mx-auto text-2xl mb-2 text-gray-600" />
                        <span className="font-medium">Cash on Delivery</span>
                      </div>
                    </label>
                    
                    <label className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${form.paymentMethod === 'card' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <FaCreditCard className="mx-auto text-2xl mb-2 text-gray-600" />
                        <span className="font-medium">Swipe card on delivery</span>
                      </div>
                    </label>
                    
                    <label className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${form.paymentMethod === 'online' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod"
                        value="online"
                        checked={form.paymentMethod === 'online'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <FaCreditCard className="mx-auto text-2xl mb-2 text-gray-600" />
                        <span className="font-medium">Online Payment</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Change Request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Request
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-4 py-3 font-medium">Rs.</span>
                    <input 
                      type="number" 
                      value={changeRequest}
                      onChange={(e) => setChangeRequest(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-r-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Order</h2>
              
              {cartItems.map((item) => (
                <div key={item.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">View Publisher: Former Finance Branch No.</p>
                      <p className="text-xs text-gray-500">View Add-cnn v.</p>
                    </div>
                    <span className="font-bold text-gray-800">Rs. {item.price}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Quantity: {item.quantity} × Rs. {item.price / item.quantity}
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="space-y-3 mt-6 pt-6 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">Rs. {orderSummary.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax 15%</span>
                  <span className="font-medium">Rs. {orderSummary.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">Rs. {orderSummary.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">- Rs. {orderSummary.discount}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Grand Total</span>
                  <span>Rs. {orderSummary.grandTotal}</span>
                </div>
              </div>

              {/* Voucher Code */}
              <div className="mt-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Voucher / Promo code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button 
                    type="button"
                    className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Place Order Button */}
              <button 
                type="submit"
                onClick={handleSubmit}
                className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Place Order
              </button>

              {/* Continue Shopping */}
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="w-full mt-4 text-amber-600 py-3 rounded-xl font-medium border-2 border-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
              >
                ← Continue to add more items
              </button>
            </div>

            {/* Activation Section */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Activate</h3>
                <p className="mb-4">Special offers for activated users!</p>
                <button className="bg-white text-amber-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                  Go to Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}