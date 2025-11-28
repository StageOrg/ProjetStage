import AnonymatService from "@/services/anonymatService";
import { useState } from "react";
import {useRef} from "react";

export default function SaisieAnonymat({ ueId, etudiants, setEtudiants,  evaluation,
 annee_id, periodeActive}) {

 // Tableau de références pour chaque champ
  const inputRefs = useRef([]);

  const handleChangeNumeroAnonyme = async (index, value) => {
    try {
      const updated = [...etudiants];
      const etu = updated[index];
      updated[index].num_anonymat = value; 
      setEtudiants(updated);

      if (etu.num_anonymat_id) {
        console.log("Mise à jour anonymat existant pour étudiant ID :", etu.id, "avec numéro :", value, "anonymat ID :", etu.num_anonymat_id);
        await AnonymatService.updateAnonymat(etu.num_anonymat_id,
          etu.id,
          ueId,
          value,
          annee_id
        );
      } else {
        const newAnonymat = await AnonymatService.createAnonymat(
          etu.id,
          ueId,
          value,
          annee_id
        );
        updated[index].num_anonymat_id = newAnonymat.id;
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
            <th className="border px-2 py-1">Numéro Anonymat</th>
          </tr>
        </thead>
        <tbody>
          {etudiants.length === 0 ? (
            <tr>
              <td className="border p-2" colSpan="3">Aucun étudiant inscrit. Revoyez l'année académique que vous avez sélectionnée.</td>
            </tr>
          ) : (
            etudiants.map((etu, index) => (
              <tr key={etu.id} className="even:bg-gray-50">
                <td className="border px-2 py-1">{etu.nom}</td>
                <td className="border px-2 py-1">{etu.prenom}</td>
                <td className="border px-2 py-1 text-center">
                <input
                  ref={(el) => (inputRefs.current[index] = el)}
                  disabled={noteSaisie}
                  type="text"
                  value={etu.num_anonymat}
                    onChange={(e) => {
                      const updated = [...etudiants];
                      updated[index].num_anonymat = e.target.value;
                      setEtudiants(updated);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = etudiants[index].num_anonymat;

                        if (value.trim() === "") {
                          alert("Le numéro d'anonymat ne peut pas être vide.");
                          return;
                        }

                        handleChangeNumeroAnonyme(index, value);
                        // 👇 Aller au champ suivant automatiquement
                        if (inputRefs.current[index + 1]) {
                          inputRefs.current[index + 1].focus();
                        }
                      }
                    }}
                  className="w-24 text-center border rounded"
                />
              </td>
            </tr>
          ))
          )}
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
