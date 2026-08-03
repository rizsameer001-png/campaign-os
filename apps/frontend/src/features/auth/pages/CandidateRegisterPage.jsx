import RegisterForm from '../components/RegisterForm';

export default function CandidateRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-semibold mb-6 text-center">Register your campaign</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
