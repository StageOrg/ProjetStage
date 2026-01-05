import InfosUe from "@/features/enseignant/dashboard/cours/infosUe";

export default async function PageInfosUe({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return <InfosUe ueId={id} />; 
}