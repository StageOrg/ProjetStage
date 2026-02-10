"use client";
import { useEffect, useState } from "react";
import UtilisateurService from "@/services/utilisateurService";
import ImportUsersExcel from "./importUsersExcel";
import  RegisterForm from "./AjoutUtilisateur";
import { useRouter } from "next/navigation";
import { FaTrash, FaEdit } from "react-icons/fa";


export default function ListeUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // ✅ Chargement des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const utilisateursData = await UtilisateurService.getAllUtilisateurs();
        setUtilisateurs(utilisateursData);
        setFilteredUsers(utilisateursData);
      } catch (err) {
        setError("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ✅ Filtrage par rôle
  useEffect(() => {
    if (!selectedRole) {
      setFilteredUsers(utilisateurs);
    } else {
      const filtered = utilisateurs.filter(
        (user) => user.role === selectedRole
      );
      setFilteredUsers(filtered);
    }
  }, [selectedRole, utilisateurs]);

  // ✅ Rôles dynamiques
  const rolesDisponibles = [...new Set(utilisateurs?.map(u => u.role))];
  const deleteUser = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await UtilisateurService.deleteUtilisateur(id);
        setUtilisateurs(prev => prev.filter(user => user.id !== id));
      } catch (err) {
        setError("Erreur lors de la suppression de l'utilisateur");
      }
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg text-black">
        <div className="mb-6  gap-2 h-30 flex justify-horizontal ">
            <button
            onClick={() => router.push('/administration/dashboard/nouvel-utilisateur')}
            className="bg-blue-600 text-white h-10 px-5 py-1 ml-0 mt-8  rounded-md hover:bg-blue-800 transition"
           >
            + Ajouter un utilisateur
        </button>
            <ImportUsersExcel  onSuccess={(newUsers) => {
                if(!newUsers || newUsers.length === 0) return;
            setUtilisateurs((prev) => [...prev, ...newUsers]);
            }} />
       
        </div>
      <h2 className="text-xl font-bold mb-4 mt-10 text-center text-black">Liste des utilisateurs</h2>
       
      {/* ✅ Filtre par rôle */}
      <div className="mb-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border px-4 py-2 rounded-md  text-black"
        >
          <option value="">Tous les rôles</option>
          {rolesDisponibles.map((role, idx) => (
            <option key={idx} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      

      {/* ✅ States */}
      {loading && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* ✅ Tableau */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200  text-black">
            <thead className="bg-white text-sm">
              <tr>
                <th className="px-4 py-2 border">Nom</th>
                <th className="px-4 py-2 border">Prénom</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Sexe</th>
                <th className="px-4 py-2 border">Téléphone</th>
                <th className="px-4 py-2 border">Rôle</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm ">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-black">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border font-semibold  text-black">{user.last_name}</td>
                    <td className="px-4 py-2 border font-semibold  text-black">{user.first_name}</td>
                    <td className="px-4 py-2 border font-semibold text-black">{user.email}</td>
                    <td className="px-4 py-2 border font-semibold text-black">{user.sexe}</td>
                    <td className="px-4 py-2 border font-semibold text-black">{user.telephone}</td>
                    <td className="px-4 py-2 border font-semibold text-blue-600">
                      {user.role}
                    </td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-800 transition"
                      >
                        <FaTrash className="inline-block" /> 
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
