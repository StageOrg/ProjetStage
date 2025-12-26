import InfosUePublic from "@/features/nos_profs/infosUePublic";

export default async function PageInfosUePublic({ params }) {
  const resolvedParams = await params;
  const { idUe } = resolvedParams;
  console.log("ID de l'UE pour la page infos :", idUe);
  return (
    <div>
      <InfosUePublic ueId={idUe} />
    </div>
  );
}
