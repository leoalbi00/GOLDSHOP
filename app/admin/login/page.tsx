import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm devHint={process.env.NODE_ENV !== "production"} />
    </main>
  );
}
