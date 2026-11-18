import { AccountView } from "@/components/AccountView";
export const metadata = {
  title: "حسابك | Your account",
  robots: { index: false, follow: false },
};
export default function AccountPage() {
  return <AccountView />;
}
