import { LoginPanel } from "@/components/LoginPanel";

type LoginPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextParam = Array.isArray(searchParams?.next) ? searchParams?.next[0] : searchParams?.next;
  return <LoginPanel nextParam={nextParam} />;
}
