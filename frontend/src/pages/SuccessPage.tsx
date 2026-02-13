export default function OrderSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-green-700 mb-4">🎉 Order Placed!</h1>
      <p>Thank you! Your order is confirmed.</p>
      <a href="/" className="mt-4 text-white bg-green-700 px-4 py-2 rounded">Go Home</a>
    </div>
  );
}
