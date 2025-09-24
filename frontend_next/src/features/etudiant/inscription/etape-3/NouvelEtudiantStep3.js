"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function NouvelEtudiantStep3() {
  const [formulaire, setFormulaire] = useState({
    parcours_id: "",
    filiere_id: "",
    annee_etude_id: "",
    parcours_libelle: "",
    filiere_nom: "",
    annee_etude_libelle: "",
  });
  const [options, setOptions] = useState({
    parcours: [],
    filieres: [],
    annees: [],
  });
  const [filtredFilieres, setFiltredFilieres] = useState([]);
  const [filtredAnnees, setFiltredAnnees] = useState([]);
  const [erreurs, setErreurs] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Charger les options depuis l'API
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [parcoursRes, filieresRes, anneesRes] = await Promise.all([
          api.get("/inscription/parcours/"),
          api.get("/inscription/filiere/"),
          api.get("/inscription/annee-etude/"),
        ]);
        
        setOptions({
          parcours: parcoursRes.data,
          filieres: filieresRes.data,
          annees: anneesRes.data,
        });
      } catch (err) {
        console.error("Erreur lors du chargement des options :", err);
        setErreurs({ formulaire: "Erreur lors du chargement des options." });
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();

    // Charger les données sauvegardées
    const savedData = localStorage.getItem("inscription_step3");
    if (savedData) {
      setFormulaire(JSON.parse(savedData));
    }
  }, [router]);

  // Filtrer les filières et années quand le parcours change
  useEffect(() => {
    if (formulaire.parcours_id) {
      const filieresFiltrees = options.filieres.filter(
        (filiere) => filiere.parcours && filiere.parcours.includes(parseInt(formulaire.parcours_id))
      );
      setFiltredFilieres(filieresFiltrees);

      const anneesFiltrees = options.annees.filter(
        (annee) => annee.parcours && annee.parcours.includes(parseInt(formulaire.parcours_id))
      );
      setFiltredAnnees(anneesFiltrees);
    } else {
      setFiltredFilieres([]);
      setFiltredAnnees([]);
    }
  }, [formulaire.parcours_id, options.filieres, options.annees]);

  const gererChangement = (e) => {
    const { name, value } = e.target;
    const nouvellesValeurs = { [name]: value };

    // Mettre à jour les libellés correspondants
    if (name === "parcours_id") {
      nouvellesValeurs.filiere_id = "";
      nouvellesValeurs.annee_etude_id = "";
      const parcours = options.parcours.find((p) => p.id === parseInt(value));
      nouvellesValeurs.parcours_libelle = parcours ? parcours.libelle : "";
    } else if (name === "filiere_id") {
      nouvellesValeurs.annee_etude_id = "";
      const filiere = options.filieres.find((f) => f.id === parseInt(value));
      nouvellesValeurs.filiere_nom = filiere ? filiere.nom : "";
    } else if (name === "annee_etude_id") {
      const annee = options.annees.find((a) => a.id === parseInt(value));
      nouvellesValeurs.annee_etude_libelle = annee ? annee.libelle : "";
    }

    setFormulaire((prev) => ({ ...prev, ...nouvellesValeurs }));
    if (erreurs[name]) {
      setErreurs((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validerFormulaire = () => {
    const nouvellesErreurs = {};
    if (!formulaire.parcours_id) {
      nouvellesErreurs.parcours_id = "Veuillez sélectionner un parcours";
    }
    if (!formulaire.filiere_id) {
      nouvellesErreurs.filiere_id = "Veuillez sélectionner une filière";
    }
    if (!formulaire.annee_etude_id) {
      nouvellesErreurs.annee_etude_id = "Veuillez sélectionner une année";
    }
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  const soumettreFormulaire = (e) => {
    e.preventDefault();
    if (!validerFormulaire()) return;

    localStorage.setItem("inscription_step3", JSON.stringify(formulaire));
    router.push("/etudiant/inscription/etape-4");
  };

  return (
    <form
      onSubmit={soumettreFormulaire}
      className="bg-white mx-auto backdrop-blur-md px-8 py-10 w-full max-w-lg flex flex-col gap-6 shadow-xl border border-gray-300 rounded-lg animate-fade-in"
    >
      <h2 className="text-2xl font-bold text-center mb-6">
        Sélection des informations pédagogiques
      </h2>

      {erreurs.formulaire && (
        <p className="text-red-500 text-center">{erreurs.formulaire}</p>
      )}

      {/* Parcours */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Parcours*
        </label>
        <select
          name="parcours_id"
          value={formulaire.parcours_id}
          onChange={gererChangement}
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.parcours_id ? "border-red-500" : "border-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70`}
        >
          <option value="">Sélectionnez un parcours</option>
          {options.parcours.map((parcours) => (
            <option key={parcours.id} value={parcours.id}>
              {parcours.libelle}
            </option>
          ))}
        </select>
        {erreurs.parcours_id && (
          <p className="text-red-500 text-sm mt-1">{erreurs.parcours_id}</p>
        )}
      </div>

      {/* Filière */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Filière*
        </label>
        <select
          name="filiere_id"
          value={formulaire.filiere_id}
          onChange={gererChangement}
          disabled={!formulaire.parcours_id}
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.filiere_id ? "border-red-500" : "border-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 ${
            !formulaire.parcours_id ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="">
            {formulaire.parcours_id ? "Sélectionnez une filière" : "Veuillez d'abord sélectionner un parcours"}
          </option>
          {filtredFilieres.map((filiere) => (
            <option key={filiere.id} value={filiere.id}>
              {filiere.nom}
            </option>
          ))}
        </select>
        {erreurs.filiere_id && (
          <p className="text-red-500 text-sm mt-1">{erreurs.filiere_id}</p>
        )}
      </div>

      {/* Année */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Année*</label>
        <select
          name="annee_etude_id"
          value={formulaire.annee_etude_id}
          onChange={gererChangement}
          disabled={!formulaire.parcours_id}
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.annee_etude_id ? "border-red-500" : "border-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 ${
            !formulaire.parcours_id ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="">
            {formulaire.parcours_id ? "Sélectionnez une année" : "Veuillez d'abord sélectionner un parcours"}
          </option>
          {filtredAnnees.map((annee) => (
            <option key={annee.id} value={annee.id}>
              {annee.libelle}
            </option>
          ))}
        </select>
        {erreurs.annee_etude_id && (
          <p className="text-red-500 text-sm mt-1">{erreurs.annee_etude_id}</p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between mt-6 gap-4">
        <Link
          href="/etudiant/inscription/etape-2"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Retour
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded-full shadow transition-all disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Suivant"}
        </button>
      </div>
    </form>
  );
}