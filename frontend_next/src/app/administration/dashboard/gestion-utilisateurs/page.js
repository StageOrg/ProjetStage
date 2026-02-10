import ListeUtilisateurs from "@/features/administration/register/utilisateurs";
export default function GestionUtilisateurs() {
  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 space-y-8 text-black">
      <ListeUtilisateurs />
    </div>
  );
}