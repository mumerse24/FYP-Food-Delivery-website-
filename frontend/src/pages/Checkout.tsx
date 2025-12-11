import React, { useState } from "react";
import { useCart } from "@/lib/cart-context";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaMapMarkerAlt, FaEnvelope, FaLandmark, FaCreditCard, FaRegMoneyBillAlt } from "react-icons/fa";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  customizations?: any[];
  specialInstructions?: string;
}

export default function CheckoutPage() {
  const { state: cart, dispatch } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "Mr",
    fullName: "",
    mobileNumber: "",
    deliveryAddress: "",
    nearestLandmark: "",
    emailAddress: "",
    deliveryInstructions: "",
    paymentMethod: "Cash" as "Cash" | "Card" | "Online Payment",
  });

  const [sendAsGift, setSendAsGift] = useState(false);
  const [changeRequest, setChangeRequest] = useState(0);
  const [voucherCode, setVoucherCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Dynamic order calculation
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const deliveryFee = 150;
  const discount = 0;
  const grandTotal = subtotal + tax + deliveryFee - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart.items.length) {
      alert("Your cart is empty!");
      return;
    }

    try {
      const items = cart.items.map((item: CartItem) => ({
        menuItem: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: item.price * item.quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || "",
      }));

      const response = await axios.post("http://localhost:5000/api/orders", {
        restaurant: "RESTAURANT_ID",
        items,
        deliveryAddress: {
          street: form.deliveryAddress,
          landmark: form.nearestLandmark,
        },
        contactInfo: {
          phone: form.mobileNumber,
          email: form.emailAddress,
          fullName: form.fullName,
        },
        paymentInfo: {
          method: form.paymentMethod,
        },
        orderType: "delivery",
        specialInstructions: form.deliveryInstructions,
        sendAsGift,
        changeRequest,
      });

      alert("Order placed successfully! Order ID: " + response.data.data._id);
      dispatch({ type: "CLEAR_CART" });
      navigate("/order-success");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to place order. Try again!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-amber-500">●</span> Delivery Order <span className="text-amber-500">●</span>
          </p>
          <p className="text-gray-500 mt-1">Please fill in your details to complete the order:</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Send as Gift */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Send as a Gift</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={sendAsGift} onChange={(e) => setSendAsGift(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <select name="title" value={form.title} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                      {["Mr", "Mrs", "Ms", "Dr"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><FaPhone className="inline mr-2 text-gray-400" /> Mobile Number <span className="text-red-500">*</span></label>
                  <input type="tel" name="mobileNumber" placeholder="0300-XXXXXXX" value={form.mobileNumber} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><FaMapMarkerAlt className="inline mr-2 text-gray-400" /> Delivery Address <span className="text-red-500">*</span></label>
                  <input type="text" name="deliveryAddress" placeholder="Enter your complete address" value={form.deliveryAddress} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                </div>

                {/* Landmark & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><FaLandmark className="inline mr-2 text-gray-400" /> Nearest Landmark</label>
                    <input type="text" name="nearestLandmark" placeholder="Optional" value={form.nearestLandmark} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><FaEnvelope className="inline mr-2 text-gray-400" /> Email Address</label>
                    <input type="email" name="emailAddress" placeholder="Optional" value={form.emailAddress} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
                  <textarea name="deliveryInstructions" placeholder="Any special instructions" value={form.deliveryInstructions} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["Cash", "Card", "Online Payment"].map((method) => (
                      <label key={method} className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${form.paymentMethod === method ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}>
                        <input type="radio" name="paymentMethod" value={method} checked={form.paymentMethod === method} onChange={handleChange} className="sr-only"/>
                        <div className="text-center">
                          {method === "Cash" ? <FaRegMoneyBillAlt className="mx-auto text-2xl mb-2 text-gray-600"/> : <FaCreditCard className="mx-auto text-2xl mb-2 text-gray-600"/>}
                          <span className="font-medium">{method}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Change Request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Change Request</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-4 py-3 font-medium">Rs.</span>
                    <input type="number" value={changeRequest} onChange={(e) => setChangeRequest(Number(e.target.value))} className="w-full border border-gray-300 rounded-r-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"/>
                  </div>
                </div>

                <button type="submit" className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg">Place Order</button>
              </form>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Order</h2>
              {cart.items.map((item: CartItem) => (
                <div key={item.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                    </div>
                    <span className="font-bold text-gray-800">Rs. {item.price * item.quantity}</span>
                  </div>
                  <div className="text-sm text-gray-700">Quantity: {item.quantity}</div>
                </div>
              ))}

              {/* Summary */}
              <div className="space-y-3 mt-6 pt-6 border-t">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">Rs. {subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tax (8%)</span><span className="font-medium">Rs. {tax}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Delivery Fee</span><span className="font-medium">Rs. {deliveryFee}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium">- Rs. {discount}</span></div>}
                <div className="flex justify-between text-lg font-bold pt-3 border-t"><span>Grand Total</span><span>Rs. {grandTotal}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
