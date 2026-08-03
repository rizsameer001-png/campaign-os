import LoginForm from '../components/LoginForm';

export default function CandidateLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-semibold mb-6 text-center">Log in to your campaign</h1>
        <LoginForm />
      </div>
    </div>
  );
}
