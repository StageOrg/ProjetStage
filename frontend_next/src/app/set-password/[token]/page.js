import SetPasswordForm from "@/features/administration/register/setPassword";

import { useParams } from "next/navigation";

export default function SetPasswordPage() {
  const { token } = useParams();

  if (!token) {
    return <p style={{ textAlign: "center" }}>❌ Lien invalide</p>;
  }

  return <SetPasswordForm token={token} />;
}
