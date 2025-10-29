import AnonymatService from "@/services/anonymatService";
import { useState } from "react";

export default function SaisieAnonymat({ ueId, etudiants, setEtudiants,  evaluation,
 annee_id, periodeActive}) {

  const handleChangeNumeroAnonyme = async (index, value) => {
    try {
      const updated = [...etudiants];
      const etu = updated[index];
      updated[index].num_anonymat = value; 
      setEtudiants(updated);

      if (etu.num_anonyme_id) {
        await AnonymatService.updateAnonymat(etu.num_anonyme_id, {
          etudiant: etu.id,
          ue: ueId,
          numero: value,
          annee_academique: annee_id
        });
      } else {
        const newAnonymat = await AnonymatService.createAnonymat(
          etu.id,
          ueId,
          value,
          annee_id
        );
        updated[index].num_anonyme_id = newAnonymat.id;
        setEtudiants([...updated]);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du numéro anonyme :", err);
    }
  };

  const verifierNoteSaisie = (listeEtudiants) => {
    return (listeEtudiants || []).some((etu) => {
      const note = etu.notes?.[evaluation?.id];
      return note !== undefined && note !== null && note !== "";
    });
  };

  const noteSaisie = verifierNoteSaisie(etudiants);
  if(noteSaisie){
    console.log("Notes déjà saisies, désactivation de la saisie des numéros anonymes.");
  }

  return (
    <div className="mt-6">

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Nom</th>
            <th className="border px-2 py-1">Prénom</th>
            <th className="border px-2 py-1">Numéro Anonyme</th>
          </tr>
        </thead>
        <tbody>
          {etudiants.map((etu, index) => (
            <tr key={etu.id} className="even:bg-gray-50">
              <td className="border px-2 py-1">{etu.nom}</td>
              <td className="border px-2 py-1">{etu.prenom}</td>
              <td className="border px-2 py-1 text-center">
                <input
                  disabled={noteSaisie}
                  type="text"
                  value={etu.num_anonymat}
                  onChange={(e) => handleChangeNumeroAnonyme(index, e.target.value)}
                  className="w-24 text-center border rounded"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center mt-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={() => {
            alert("Numéros anonymes enregistrés. Fin de la saisie.");
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
