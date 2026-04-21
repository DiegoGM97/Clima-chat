import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <main className="sky-page flex items-center justify-center p-6 md:p-10">
      <div className="sky-page-content w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
